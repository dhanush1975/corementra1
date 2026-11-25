import { useEffect, useState } from "react";
import { Link } from "react-router";
import { signOut } from "aws-amplify/auth";
import { download, PROD_SEED, seedIncome } from "./data";
import { absorbClients, isAbsorbed, remapDb } from "./people";
import { DBtn, Modal } from "./ui";
import { useDb } from "./useDb";
import { client } from "./client";
import { diffAndSync, listAll } from "./sync";
import type { IncomeData, LegacyClient, PartnerIncome, Product, Sale, ScreenId } from "./types";
import { DashboardScreen } from "./screens/DashboardScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { BoothScreen } from "./screens/BoothScreen";
import { PipelineScreen } from "./screens/PipelineScreen";
import { FollowUpsScreen } from "./screens/FollowUpsScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { ClientsScreen } from "./screens/ClientsScreen";
import { ApplicationsScreen } from "./screens/ApplicationsScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { IncomeScreen } from "./screens/IncomeScreen";
import { AgentsScreen } from "./screens/AgentsScreen";
import { EmailAutomationScreen } from "./screens/EmailAutomationScreen";
import { BlogScreen } from "./screens/BlogScreen";
import { DataScreen } from "./screens/DataScreen";

const NAV: { id: ScreenId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "M4 4h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM4 14h6v6H4z" },
  { id: "events", label: "Events", icon: "M4 6h16v14H4zM8 3v4M16 3v4M4 11h16" },
  { id: "booth", label: "Booth", icon: "M3 9l1.5-5h15L21 9M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8M10 20v-5h4v5" },
  { id: "pipeline", label: "Pipeline", icon: "M4 6h16M7 12h10M10 18h4" },
  { id: "followUps", label: "Follow-Ups", icon: "M20 12a8 8 0 1 1-4.4-7.1M9 12l2.6 2.6L20 6" },
  { id: "calendar", label: "Calendar", icon: "M7 3v4M17 3v4M4 9h16M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" },
  { id: "clients", label: "Clients", icon: "M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M12 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7M17 13.5a4.5 4.5 0 0 1 4 4.5v1" },
  { id: "applications", label: "Questionnaires", icon: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" },
  { id: "products", label: "Products", icon: "M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" },
  { id: "income", label: "Income", icon: "M12 3v18M16.5 7.5c0-1.9-2-3-4.5-3s-4.5 1.1-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3.3-2 3.2-4.5 3.2-4.5-1.1-4.5-3" },
  { id: "agents", label: "Agents", icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "automation", label: "Automation", icon: "M13 2 3 14h7l-1 8 10-12h-7l1-8z" },
  { id: "blog", label: "Blog", icon: "M4 4h12a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2zM18 9h2v9a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h3" },
  { id: "data", label: "Data", icon: "M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" },
];

const SETTINGS_ID = "levels-singleton";

export function DashboardApp() {
  const { db, commit, adopt, toast, resetSeed, resetEmpty, loading: dbLoading } = useDb();
  const [screen, setScreen] = useState<ScreenId>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [income, setIncome] = useState<IncomeData>({ levels: [10, 5, 3], sales: [], partner: [] });
  const [dataLoading, setDataLoading] = useState(true);
  // An application to open when switching to Applications from a person.
  const [openAppId, setOpenAppId] = useState<string | null>(null);
  // Rows still in the old, separate Clients table (see combineClients).
  const [allLegacyClients, setLegacyClients] = useState<LegacyClient[]>([]);
  // Old rows are kept as a backup after combining; only offer the ones
  // that don't have their person yet.
  const legacyClients = allLegacyClients.filter(c => !isAbsorbed(c, db.prospects));
  const [combining, setCombining] = useState(false);

  useEffect(() => {
    if (dbLoading) return;
    (async () => {
      const [productsRaw, salesRaw, partnerRaw, settingsRes] = await Promise.all([
        listAll<Product>(client.models.Product as any),
        listAll<Sale>(client.models.Sale as any),
        listAll<PartnerIncome>(client.models.PartnerIncome as any),
        client.models.Settings.get({ id: SETTINGS_ID }),
      ]);
      // Products are real catalog data (loaded from the CSV import), so an
      // empty table really does mean "never seeded" — fall back and persist.
      // Income (Sales/Partner) has no such real baseline: an empty table
      // means the user genuinely wants it empty (e.g. after a reset), so it
      // must NOT be auto-repopulated with sample numbers on every load.
      const seededProducts = productsRaw.length ? productsRaw : PROD_SEED;
      if (!productsRaw.length) diffAndSync(client.models.Product as any, [], seededProducts);

      const seededIncome: IncomeData = {
        levels: settingsRes.data?.levels?.filter((n): n is number => n != null) ?? [10, 5, 3],
        sales: salesRaw,
        partner: partnerRaw,
      };

      setProducts(seededProducts);
      setIncome(seededIncome);
      setDataLoading(false);
      listAll<LegacyClient>(client.models.Client as any)
        .then(rows => setLegacyClients(rows))
        .catch(err => console.error("Old clients list failed to load:", err));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbLoading]);

  const updateProducts = (next: Product[]) => {
    diffAndSync(client.models.Product as any, products, next);
    setProducts(next);
  };
  const updateIncome = (next: IncomeData) => {
    if (next.levels !== income.levels) {
      client.models.Settings.update({ id: SETTINGS_ID, levels: next.levels }).catch(() => {
        client.models.Settings.create({ id: SETTINGS_ID, levels: next.levels }).catch(() => {});
      });
    }
    diffAndSync(client.models.Sale as any, income.sales, next.sales);
    diffAndSync(client.models.PartnerIncome as any, income.partner, next.partner);
    setIncome(next);
  };

  const clearIncome = () => {
    diffAndSync(client.models.Sale as any, income.sales, []);
    diffAndSync(client.models.PartnerIncome as any, income.partner, []);
    setIncome(prev => ({ ...prev, sales: [], partner: [] }));
  };
  const seedIncomeSample = () => {
    const sample = seedIncome(db, products);
    diffAndSync(client.models.Sale as any, income.sales, sample.sales);
    diffAndSync(client.models.PartnerIncome as any, income.partner, sample.partner);
    setIncome(sample);
  };

  const go = (id: ScreenId) => { setScreen(id); setMobileNavOpen(false); };
  const openApplication = (id: string) => { setOpenAppId(id); go("applications"); };

  const remapSales = (idMap: Record<string, string>) => {
    if (!income.sales.some(s => idMap[s.clientId])) return;
    updateIncome({ ...income, sales: income.sales.map(s => (idMap[s.clientId] ? { ...s, clientId: idMap[s.clientId] } : s)) });
  };

  // One-time move of the old Clients table into the people list: each
  // client joins the prospect they came from (or the same name + email),
  // or becomes a person of their own; sales, purchases, feedback and
  // applications follow; then the old rows are deleted.
  const combineClients = async () => {
    setCombining(true);
    const { people, idMap } = absorbClients(db.prospects, legacyClients);
    const fail = (msg: string) => {
      setCombining(false);
      window.alert(msg + " Nothing was removed from the old clients list; you can try again.");
    };

    // 1. Write the combined people and wait for every write to succeed.
    //    The old client rows are only deleted once their new record is
    //    confirmed saved, so a failure can never lose a client.
    const before = new Map(db.prospects.map(p => [p.id, p]));
    const changed = people.filter(p => JSON.stringify(before.get(p.id)) !== JSON.stringify(p));
    for (const p of changed) {
      const res = await (before.has(p.id) ? client.models.Prospect.update(p as any) : client.models.Prospect.create(p as any)).catch(e => ({ errors: [e] }));
      if ((res as any).errors?.length) {
        console.error("Combining failed on", p.name, (res as any).errors);
        // Rows already written are harmless: combining again matches them
        // by id and finishes the job.
        return fail(`Couldn't save ${p.name}. Is the backend deployed (npx ampx sandbox)?`);
      }
    }
    adopt({ ...db, prospects: people });

    // 2. Point sales, purchases, feedback and applications at the people.
    for (const [from, to] of Object.entries(idMap)) {
      const res = await client.models.Application.list({ filter: { clientId: { eq: from } }, limit: 1000, selectionSet: ["id"] }).catch(() => null);
      for (const a of res?.data ?? []) await client.mutations.linkApplication({ id: a.id, clientId: to }).catch(() => {});
    }
    commit(remapDb({ ...db, prospects: people }, idMap), `Combined ${legacyClients.length} clients into your people list`);
    remapSales(idMap);

    // The old Client rows are left exactly as they were, as a backup.
    setCombining(false);
  };

  if (dbLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] text-sm text-[#667085]" style={{ fontFamily: "Inter, sans-serif" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#fafafa] text-[#0a0a0a]" style={{ fontFamily: "Inter, sans-serif" }}>
      <aside className={`w-64 shrink-0 bg-white border-r border-[#e5e5e5] flex-col gap-6 py-5 fixed lg:sticky top-0 h-screen overflow-y-auto z-40 ${mobileNavOpen ? "flex" : "hidden lg:flex"}`}>
        <div className="px-5 flex items-center justify-between">
          <Link to="/" className="flex flex-col leading-none">
            <span className="text-sm font-black text-[#0a0a0a]">CoreMentra</span>
            <span className="text-[10px] text-[#a3a3a3] uppercase tracking-wider mt-0.5">Agent Dashboard</span>
          </Link>
          <button className="lg:hidden text-[#667085]" onClick={() => setMobileNavOpen(false)}>✕</button>
        </div>
        <div className="px-5 -mt-3">
          <button onClick={() => signOut().then(() => window.location.reload())} className="text-[11px] text-[#98a2b3] hover:text-[#667085] transition-colors">Sign out</button>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map(item => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`flex items-center gap-2.5 text-left rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${active ? "bg-[#0a0a0a] text-white" : "text-[#475467] hover:bg-[#f2f4f7]"}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-90">
                  <path d={item.icon} />
                </svg>
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto mx-4 p-3 rounded-xl bg-[#f5f5f5] text-[11px] leading-relaxed text-[#667085]">
          Data is saved to the cloud. Download a JSON backup from <strong className="text-[#0a0a0a]">Data</strong> for safekeeping.
        </div>
      </aside>

      {mobileNavOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setMobileNavOpen(false)} />}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 px-5 lg:px-8 py-4 bg-[#fafafa]/90 backdrop-blur border-b border-[#e5e5e5]">
          <button className="lg:hidden p-2 -ml-2 text-[#0a0a0a]" onClick={() => setMobileNavOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex-1" />
          <span className="text-xs text-[#98a2b3]">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
        </header>

        {toast && (
          <div className="mx-5 lg:mx-8 mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#eaf3ec] border border-[#cfe5d6] text-[#1f6b4a] text-sm">
            {toast}
          </div>
        )}

        <div className="px-5 lg:px-8 py-6">
          {screen === "dashboard" && <DashboardScreen db={db} income={income} goFollowUps={() => go("followUps")} />}
          {screen === "events" && <EventsScreen db={db} commit={commit} />}
          {screen === "booth" && <BoothScreen db={db} commit={commit} />}
          {screen === "pipeline" && <PipelineScreen db={db} commit={commit} income={income} setIncome={updateIncome} onOpenApplication={openApplication} />}
          {screen === "followUps" && <FollowUpsScreen db={db} commit={commit} />}
          {screen === "calendar" && <CalendarScreen db={db} commit={commit} />}
          {screen === "clients" && <ClientsScreen db={db} income={income} commit={commit} setIncome={updateIncome} onOpenApplication={openApplication} />}
          {screen === "applications" && <ApplicationsScreen db={db} commit={commit} openId={openAppId} onOpened={() => setOpenAppId(null)} />}
          {screen === "products" && <ProductsScreen products={products} setProducts={updateProducts} />}
          {screen === "income" && <IncomeScreen db={db} products={products} income={income} setIncome={updateIncome} />}
          {screen === "agents" && <AgentsScreen db={db} income={income} commit={commit} />}
          {screen === "automation" && <EmailAutomationScreen />}
          {screen === "blog" && <BlogScreen />}
          {screen === "data" && <DataScreen db={db} income={income} commit={commit} resetSeed={() => resetSeed(seedIncomeSample)} resetEmpty={() => resetEmpty(clearIncome)} remapSales={remapSales} />}
        </div>
      </main>

      {legacyClients.length > 0 && (
        <Modal title="Combine clients and prospects" subtitle="One-time update" onClose={() => { if (!combining) setLegacyClients([]); }}>
          <div className="flex flex-col gap-3 text-sm text-[#475467]">
            <p>
              Clients are now part of the same list as prospects, so each person has one record. You have{" "}
              <strong className="text-[#0a0a0a]">{legacyClients.length}</strong> client{legacyClients.length === 1 ? "" : "s"} in the old list to move over.
            </p>
            <p>A client who came from a prospect (or has the same name and email) joins that record. Everyone else becomes a new record. Their sales, purchases, feedback and questionnaires move with them.</p>
            <p className="text-xs text-[#98a2b3]">
              Nothing is deleted: the old client records stay as they are, as a backup. Until you combine, those clients don't show on the Clients board.
              You can close this and do it later; it's offered each time the dashboard opens.
            </p>
            <div className="flex justify-between gap-2 mt-2 flex-wrap">
              <DBtn variant="secondary" onClick={() => download("crm-backup-before-combine.json", JSON.stringify({ ...db, clients: legacyClients }, null, 2), "application/json")}>Download backup first</DBtn>
              <DBtn onClick={combineClients} disabled={combining}>{combining ? "Combining…" : "Combine now"}</DBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
