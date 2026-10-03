import { useEffect, useState } from "react";
import { Link } from "react-router";
import { signOut } from "aws-amplify/auth";
import { PROD_SEED, seedIncome } from "./data";
import { useDb } from "./useDb";
import { client } from "./client";
import { diffAndSync, listAll } from "./sync";
import type { IncomeData, PartnerIncome, Product, Sale, ScreenId } from "./types";
import { DashboardScreen } from "./screens/DashboardScreen";
import { EventsScreen } from "./screens/EventsScreen";
import { PipelineScreen } from "./screens/PipelineScreen";
import { FollowUpsScreen } from "./screens/FollowUpsScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { ClientsScreen } from "./screens/ClientsScreen";
import { FeedbackScreen } from "./screens/FeedbackScreen";
import { ProductsScreen } from "./screens/ProductsScreen";
import { IncomeScreen } from "./screens/IncomeScreen";
import { AgentsScreen } from "./screens/AgentsScreen";
import { AIScreen } from "./screens/AIScreen";
import { DataScreen } from "./screens/DataScreen";

const NAV: { id: ScreenId; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "M4 4h6v6H4zM14 4h6v6h-6zM14 14h6v6h-6zM4 14h6v6H4z" },
  { id: "events", label: "Events", icon: "M4 6h16v14H4zM8 3v4M16 3v4M4 11h16" },
  { id: "pipeline", label: "Pipeline", icon: "M4 6h16M7 12h10M10 18h4" },
  { id: "followUps", label: "Follow-Ups", icon: "M20 12a8 8 0 1 1-4.4-7.1M9 12l2.6 2.6L20 6" },
  { id: "calendar", label: "Calendar", icon: "M7 3v4M17 3v4M4 9h16M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" },
  { id: "clients", label: "Clients", icon: "M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M12 4a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7M17 13.5a4.5 4.5 0 0 1 4 4.5v1" },
  { id: "products", label: "Products", icon: "M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10" },
  { id: "income", label: "Income", icon: "M12 3v18M16.5 7.5c0-1.9-2-3-4.5-3s-4.5 1.1-4.5 3 2 2.6 4.5 3 4.5 1.3 4.5 3.3-2 3.2-4.5 3.2-4.5-1.1-4.5-3" },
  { id: "feedback", label: "Feedback", icon: "M4 5h16v11H9l-5 4z" },
  { id: "agents", label: "Agents", icon: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { id: "ai", label: "AI Assistant", icon: "M12 3l2.2 5.3L19.5 10l-5.3 1.7L12 17l-2.2-5.3L4.5 10l5.3-1.7z" },
  { id: "data", label: "Data", icon: "M4 6c0 1.7 3.6 3 8 3s8-1.3 8-3-3.6-3-8-3-8 1.3-8 3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" },
];

const SETTINGS_ID = "levels-singleton";

export function DashboardApp() {
  const { db, commit, toast, resetSeed, resetEmpty, loading: dbLoading } = useDb();
  const [screen, setScreen] = useState<ScreenId>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [income, setIncome] = useState<IncomeData>({ levels: [10, 5, 3], sales: [], partner: [] });
  const [dataLoading, setDataLoading] = useState(true);

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
          {screen === "pipeline" && <PipelineScreen db={db} commit={commit} />}
          {screen === "followUps" && <FollowUpsScreen db={db} commit={commit} />}
          {screen === "calendar" && <CalendarScreen db={db} commit={commit} />}
          {screen === "clients" && <ClientsScreen db={db} income={income} commit={commit} />}
          {screen === "feedback" && <FeedbackScreen db={db} commit={commit} />}
          {screen === "products" && <ProductsScreen products={products} setProducts={updateProducts} />}
          {screen === "income" && <IncomeScreen db={db} products={products} income={income} setIncome={updateIncome} />}
          {screen === "agents" && <AgentsScreen db={db} income={income} commit={commit} />}
          {screen === "ai" && <AIScreen db={db} income={income} />}
          {screen === "data" && <DataScreen db={db} income={income} commit={commit} resetSeed={() => resetSeed(seedIncomeSample)} resetEmpty={() => resetEmpty(clearIncome)} />}
        </div>
      </main>
    </div>
  );
}
