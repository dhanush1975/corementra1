import { useCallback, useEffect, useState, type ReactNode } from "react";
import { client } from "./client";
import { listAll } from "./sync";
import { money, shortDate, STAGE_TITLES } from "./data";
import { eventsOf } from "./people";
import { TagPill } from "./RecordTable";
import { TypeBadge } from "./PersonAutocomplete";
import { DBtn } from "./ui";
import { AnalysisView } from "../booth/AnalysisView";
import { computeAnalysis, parseAnalysis } from "../booth/fna";
import { LinkActions, LinkStatus, useNow } from "./applications/LinkActions";
import { ApplicationEditor, ROW_FIELDS, type ApplicationRow } from "./screens/ApplicationsScreen";
import type { BoothEntry, Db, IncomeData, Prospect } from "./types";

// Everything about one person in one place, opened as a side panel when
// you click them in the Pipeline or on the Clients board: details, their
// questionnaire (status, send/resend, open it right here), booth analyses,
// events, follow-ups, purchases and notes.

export function PersonPanel({
  person, db, income, onClose, children,
}: {
  person: Prospect;
  db: Db;
  income: IncomeData;
  // Kept for callers; questionnaires now open inside the panel.
  onOpenApplication?: (id: string) => void;
  onClose: () => void;
  // Screen-specific actions (advance stage, follow-up, edit, delete…).
  children?: ReactNode;
}) {
  const [booth, setBooth] = useState<BoothEntry[] | null>(null);
  const [apps, setApps] = useState<ApplicationRow[] | null>(null);
  const [openEntry, setOpenEntry] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApplicationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const now = useNow();

  // Booth analyses and questionnaires aren't part of db, so they're
  // fetched for this person when the panel opens.
  const load = useCallback(() => {
    setBooth(null);
    setApps(null);
    listAll<BoothEntry>(client.models.BoothEntry as any)
      .then(rows => {
        const mine = rows.filter(e => e.prospectId === person.id).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
        setBooth(mine);
        if (mine.length === 1) setOpenEntry(mine[0].id);
      })
      .catch(() => setBooth([]));
    client.models.Application.list({ filter: { clientId: { eq: person.id } }, limit: 1000, selectionSet: [...ROW_FIELDS] })
      .then(res => setApps(((res.data as ApplicationRow[]) ?? []).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""))))
      .catch(() => setApps([]));
  }, [person.id]);
  useEffect(load, [load]);

  // Esc closes the panel (but not while a questionnaire is open on top).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !editing) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing, onClose]);

  const patchApp = (id: string, patch: Partial<ApplicationRow>) =>
    setApps(list => list?.map(a => (a.id === id ? { ...a, ...patch } : a)) ?? list);

  const newQuestionnaire = async () => {
    setCreating(true);
    const res = await client.mutations.createApplication({ name: person.name, clientId: person.id });
    setCreating(false);
    if (res.errors?.length || !res.data) { window.alert("The questionnaire could not be created."); return; }
    load();
  };

  const deleteQuestionnaire = async (row: ApplicationRow) => {
    if (!window.confirm(`Delete ${person.name}'s questionnaire and its uploaded documents? This can't be undone.`)) return;
    const res = await client.mutations.deleteApplication({ id: row.id });
    if (res.errors?.length) { window.alert("That questionnaire could not be deleted."); return; }
    setEditing(null);
    setApps(list => list?.filter(a => a.id !== row.id) ?? list);
  };

  const events = eventsOf(person).map(id => db.events.find(e => e.id === id)).filter(Boolean) as Db["events"];
  const followUps = db.followUps.filter(f => f.prospectId === person.id).sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));
  const sales = income.sales.filter(s => s.clientId === person.id).sort((a, b) => b.date.localeCompare(a.date));
  const purchases = db.purchases.filter(p => p.clientId === person.id);
  const boothName = (id: string) => db.booths.find(b => b.id === id)?.name || "Booth";

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-[#10161c]/35 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="w-full max-w-[1040px] h-full overflow-y-auto bg-[#fafafa] shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#e5e5e5] px-5 sm:px-7 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <TypeBadge person={person} />
            <h3 className="text-xl font-bold truncate">{person.name}</h3>
            <TagPill text={STAGE_TITLES[person.stage] || person.stage} />
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#f2f4f7] text-[#475467] flex items-center justify-center text-sm hover:bg-[#e5e5e5] shrink-0" aria-label="Close">✕</button>
        </div>

        <div className="p-5 sm:p-7 flex flex-col gap-5">
          {/* Details + actions */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-5">
            <Box title="Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 text-[13px] leading-7">
                <Line label="Email">{person.email}</Line>
                <Line label="Phone">{person.phone}</Line>
                {person.address && <Line label="Address">{person.address}</Line>}
                <Line label="Source">{person.source}</Line>
                <Line label="Need">{person.need}</Line>
                <Line label="Agent">{person.agent}</Line>
                <Line label="Last contact">{shortDate(person.lastContact)}</Line>
                {person.birthday && <Line label="Birthday">{shortDate(person.birthday)}</Line>}
                {person.clientType && <Line label="Client since">{shortDate(person.since)}</Line>}
              </div>
            </Box>
            {children && <Box title="Actions"><div className="flex flex-col gap-2">{children}</div></Box>}
          </div>

          {/* Questionnaire */}
          <Box
            title="Questionnaire"
            right={<DBtn variant="secondary" onClick={newQuestionnaire} disabled={creating || apps === null}>{creating ? "Creating…" : "+ New questionnaire"}</DBtn>}
          >
            {apps === null ? <Muted>Loading…</Muted> : apps.length === 0 ? (
              <Muted>No questionnaire yet. Create one, then send {person.name.split(" ")[0]} the link.</Muted>
            ) : (
              <div className="flex flex-col gap-2">
                {apps.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-[#eef0f3] bg-[#fafbfc] px-4 py-3">
                    <LinkStatus row={a} now={now} />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <LinkActions row={a} now={now} compact onIssued={patch => patchApp(a.id, patch)} />
                      <DBtn onClick={() => setEditing(a)} className="px-3 py-1.5 text-[12px]">View questionnaire</DBtn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Box>

          {/* Booth analyses */}
          <Box title="Financial needs analysis">
            {booth === null ? <Muted>Loading…</Muted> : booth.length === 0 ? <Muted>No booth analysis.</Muted> : (
              <div className="flex flex-col gap-2">
                {booth.map(e => {
                  const open = openEntry === e.id;
                  return (
                    <div key={e.id} className="rounded-xl border border-[#eef0f3] bg-white">
                      <button
                        onClick={() => setOpenEntry(open ? null : e.id)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-[13px]"
                      >
                        <span className="font-medium">{boothName(e.boothId)} · {shortDate(e.savedAt?.slice(0, 10))}</span>
                        <span className="flex items-center gap-3 shrink-0 text-[#667085]">
                          Responsibility {money(computeAnalysis(parseAnalysis(e.analysis)).responsibility)}
                          <span className="text-[12px] font-semibold text-[#0070f3]">{open ? "Hide" : "View analysis"}</span>
                        </span>
                      </button>
                      {open && <div className="px-4 pb-4 border-t border-[#f2f4f7] pt-4"><AnalysisView analysis={parseAnalysis(e.analysis)} /></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </Box>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Box title="Events">
              {events.length === 0 ? <Muted>None.</Muted> : (
                <div className="flex flex-col gap-1 text-[13px]">
                  {events.map(e => <div key={e.id}>{e.name} <span className="text-[#98a2b3]">· {shortDate(e.date)}</span></div>)}
                </div>
              )}
            </Box>
            <Box title="Follow-ups">
              {followUps.length === 0 ? <Muted>None.</Muted> : (
                <div className="flex flex-col gap-1 text-[13px]">
                  {followUps.slice(0, 8).map(f => (
                    <div key={f.id} className="flex justify-between gap-2">
                      <span className="truncate">{f.type} · {f.note || f.subject}</span>
                      <span className="text-[#98a2b3] shrink-0">{f.status === "Completed" ? "done" : shortDate(f.dueDate)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Box>
            {(sales.length > 0 || purchases.length > 0 || person.clientType) && (
              <Box title="Purchases">
                {sales.length === 0 && purchases.length === 0 ? <Muted>No purchases logged yet — add one from the Income screen.</Muted> : (
                  <div className="flex flex-col gap-1 text-[13px]">
                    {sales.map(s => (
                      <div key={s.id} className="flex justify-between gap-2"><span className="truncate">{s.productLabel}</span><span className="shrink-0 font-semibold">{money(s.premium)}</span></div>
                    ))}
                    {purchases.map(p => (
                      <div key={p.id} className="flex justify-between gap-2"><span className="truncate">{p.product}</span><span className="shrink-0 font-semibold">{money(p.businessValue)}</span></div>
                    ))}
                  </div>
                )}
              </Box>
            )}
            <Box title="Notes">
              <p className="text-[13px] text-[#344054] whitespace-pre-wrap leading-relaxed">{person.notes || "No notes yet."}</p>
            </Box>
          </div>
        </div>
      </div>

      {/* The full questionnaire, opened on top of the panel. */}
      {editing && (
        <div className="fixed inset-0 z-[95] overflow-y-auto bg-[#fafafa]" onClick={e => e.stopPropagation()}>
          <div className="max-w-[1000px] mx-auto px-5 py-6">
            <ApplicationEditor
              key={editing.id}
              row={editing}
              clients={db.prospects}
              backLabel={`← Back to ${person.name}`}
              onSaved={row => patchApp(row.id, row)}
              onDelete={() => deleteQuestionnaire(editing)}
              onClose={() => { setEditing(null); load(); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Box({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-[#e5e5e5] rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h5 className="text-xs uppercase tracking-wider text-[#98a2b3] font-semibold">{title}</h5>
        {right}
      </div>
      {children}
    </section>
  );
}

const Line = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="truncate"><span className="text-[#98a2b3]">{label} · </span>{children || "—"}</div>
);
const Muted = ({ children }: { children: ReactNode }) => <p className="text-[13px] text-[#98a2b3]">{children}</p>;
