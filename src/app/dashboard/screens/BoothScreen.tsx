import { Clock, MapPin, CreditCard } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { initials, isFresh, money, shortDate } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { BoardCardHeader, BoardHint, BoardToggle, CardPillButton, CardRow, KanbanBoard, type BoardColumn } from "../Board";
import { DBtn, Modal } from "../ui";
import { client } from "../client";
import { listAll } from "../sync";
import { AnalysisView } from "../../booth/AnalysisView";
import { computeAnalysis, parseAnalysis } from "../../booth/fna";
import type { BoothEntry, BoothRecord, Db } from "../types";

const COLUMNS: BoardColumn<BoothRecord["status"]>[] = [
  { key: "Upcoming", label: "Upcoming", dot: "#3f7fe0" },
  { key: "Completed", label: "Completed", dot: "#8b5cf0" },
];

const boothUrl = (r: BoothRecord) => `${window.location.origin}/booth/${r.id}`;

const savedLabel = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export function BoothScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [modal, setModal] = useState<BoothRecord | null>(null);
  const [peopleFor, setPeopleFor] = useState<BoothRecord | null>(null);
  const [viewing, setViewing] = useState<BoothEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Entries are written by the public booth page, not through commit(), so
  // they're loaded here rather than in useDb — and reloadable, since new
  // ones arrive while the dashboard is open.
  const [entries, setEntries] = useState<BoothEntry[]>([]);
  const [entriesState, setEntriesState] = useState<"loading" | "ready" | "error">("loading");

  const loadEntries = useCallback(() => {
    setEntriesState("loading");
    listAll<BoothEntry>(client.models.BoothEntry as any)
      .then(rows => { setEntries(rows); setEntriesState("ready"); })
      .catch(err => { console.error("Booth entries failed to load:", err); setEntriesState("error"); });
  }, []);
  useEffect(loadEntries, [loadEntries]);

  const entriesOf = (boothId: string) =>
    entries.filter(e => e.boothId === boothId).sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));

  const copyLink = (r: BoothRecord) => {
    navigator.clipboard.writeText(boothUrl(r)).then(() => {
      setCopiedId(r.id);
      window.setTimeout(() => setCopiedId(id => (id === r.id ? null : id)), 1800);
    });
  };

  const columns: ColumnDef<BoothRecord>[] = [
    { key: "name", label: "Booth", render: r => <span className="font-medium">{r.name}</span>, sortValue: r => r.name },
    { key: "date", label: "Date", render: r => shortDate(r.date), sortValue: r => r.date },
    { key: "location", label: "Location", render: r => r.location },
    { key: "people", label: "Analyses", render: r => entriesOf(r.id).length },
    { key: "expense", label: "Expense", render: r => money(r.expense), sortValue: r => r.expense },
    { key: "status", label: "Status", render: r => <TagPill text={r.status} /> },
  ];

  // Same completion stamping as Events: the board drops a completed booth
  // after 24h while Table still shows it.
  const applyCompletion = (rec: BoothRecord, prevStatus?: BoothRecord["status"]): BoothRecord => {
    const was = prevStatus === "Completed";
    const is = rec.status === "Completed";
    if (is && !was) return { ...rec, completedAt: new Date().toISOString() };
    if (!is && was) return { ...rec, completedAt: undefined };
    return rec;
  };

  const save = (rec: BoothRecord) => {
    const prev = db.booths.find(r => r.id === rec.id);
    const finalRec = applyCompletion({ ...rec, expense: Number(rec.expense) || 0 }, prev?.status);
    const list = db.booths.slice();
    const i = list.findIndex(r => r.id === finalRec.id);
    if (i >= 0) list[i] = finalRec; else list.unshift(finalRec);
    setModal(null);
    commit({ ...db, booths: list }, (i >= 0 ? "Saved " : "Added ") + finalRec.name);
  };
  const del = (rec: BoothRecord) => {
    // Its analyses are deleted with it, so they must be known first.
    if (entriesState !== "ready") { window.alert("Saved analyses are still loading (or failed to load) — try again in a moment."); return; }
    const own = entriesOf(rec.id);
    const msg = own.length
      ? `Delete this booth and its ${own.length} saved ${own.length === 1 ? "analysis" : "analyses"}? Their prospects stay in the Pipeline.`
      : "Delete this booth?";
    if (!window.confirm(msg)) return;
    setModal(null);
    own.forEach(e => client.models.BoothEntry.delete({ id: e.id }).catch(err => console.error("Entry delete failed:", err)));
    setEntries(list => list.filter(e => e.boothId !== rec.id));
    commit({ ...db, booths: db.booths.filter(r => r.id !== rec.id) }, "Booth deleted");
  };
  const delEntry = (entry: BoothEntry) => {
    if (!window.confirm(`Delete ${entry.name}'s analysis? Their prospect stays in the Pipeline.`)) return;
    client.models.BoothEntry.delete({ id: entry.id }).then(res => {
      if (res.errors?.length) { console.error("Entry delete failed:", res.errors); window.alert("That analysis could not be deleted."); return; }
      setEntries(list => list.filter(e => e.id !== entry.id));
      setViewing(null);
    });
  };
  const moveStatus = (rec: BoothRecord, status: BoothRecord["status"]) => {
    const finalRec = applyCompletion({ ...rec, status }, rec.status);
    commit({ ...db, booths: db.booths.map(b => (b.id === rec.id ? finalRec : b)) }, rec.name + " → " + status);
  };

  const boardRows = useMemo(() => db.booths.filter(r => r.status !== "Completed" || isFresh(r.completedAt)), [db.booths]);
  const hiddenCount = db.booths.length - boardRows.length;
  const countLabel = (id: string) => (entriesState === "ready" ? String(entriesOf(id).length) : "…");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Operations</div>
          <h2 className="text-2xl font-black mt-0.5">Booth</h2>
          <p className="text-sm text-[#667085] mt-1">Each booth has a financial needs analysis link. Everyone who fills it in is listed under the booth.</p>
        </div>
        <div className="flex items-center gap-2">
          <DBtn variant="secondary" onClick={loadEntries}>Refresh</DBtn>
          <DBtn onClick={() => setModal(blankRecord("booths"))}>+ New booth</DBtn>
        </div>
      </div>

      {entriesState === "error" && (
        <p className="text-sm text-[#a4372f]">Saved analyses couldn't be loaded. <button onClick={loadEntries} className="underline">Try again</button>.</p>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <BoardToggle view={view} onChange={setView} />
        {view === "board" && <BoardHint />}
      </div>

      {view === "board" && hiddenCount > 0 && (
        <p className="text-xs text-[#98a2b3] -mt-2">
          {hiddenCount} completed more than a day ago —{" "}
          <button onClick={() => setView("table")} className="underline hover:text-[#667085]">see them in Table</button>.
        </p>
      )}

      {view === "table" ? (
        <RecordTable<BoothRecord> rows={db.booths} columns={columns} onEdit={setModal} onDelete={del} searchFn={(r, q) => (r.name + r.location).toLowerCase().includes(q)} />
      ) : (
        <KanbanBoard<BoothRecord, BoothRecord["status"]>
          columns={COLUMNS}
          rows={boardRows}
          getColumn={r => r.status}
          onMove={moveStatus}
          onAdd={status => setModal({ ...blankRecord("booths"), status })}
          onOpen={setModal}
          countNoun="BOOTH"
          renderCard={(r, col) => (
            <>
              <BoardCardHeader
                avatarText={initials(r.name)}
                avatarSeed={r.id}
                dotColor={col.dot}
                title={r.name}
                subtitle={shortDate(r.date)}
                onDelete={() => del(r)}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <CardPillButton onClick={() => setPeopleFor(r)}>View people ({countLabel(r.id)})</CardPillButton>
                <CardPillButton onClick={() => copyLink(r)}>{copiedId === r.id ? "Copied!" : "Copy link"}</CardPillButton>
                <CardPillButton onClick={() => window.open(boothUrl(r), "_blank", "noopener")}>Open</CardPillButton>
              </div>
              <CardRow icon={<MapPin size={14} />}>{r.location}</CardRow>
              <CardRow icon={<Clock size={14} />}>{r.timeFrame}</CardRow>
              <CardRow icon={<CreditCard size={14} />}>{money(r.expense)} expense</CardRow>
            </>
          )}
        />
      )}

      {modal && <RecordModal entityKey="booths" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}

      {peopleFor && !viewing && (
        <Modal title={`People — ${peopleFor.name}`} subtitle={shortDate(peopleFor.date)} onClose={() => setPeopleFor(null)}>
          <div className="flex flex-col gap-2">
            {entriesOf(peopleFor.id).map(e => {
              const prospect = db.prospects.find(p => p.id === e.prospectId);
              const analysis = parseAnalysis(e.analysis);
              const resp = computeAnalysis(analysis).responsibility;
              return (
                <div key={e.id} className="flex items-center justify-between gap-3 py-2 border-b border-[#f4f5f7] last:border-0">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{e.name}</div>
                    <div className="text-xs text-[#98a2b3] truncate">{[e.email, e.phone].filter(Boolean).join(" · ")}</div>
                    <div className="text-xs text-[#98a2b3]">Responsibility {money(resp)} · {analysis.booked ? "meeting booked" : "no meeting yet"} · saved {savedLabel(e.savedAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {prospect && <TagPill text={prospect.stage} />}
                    <DBtn variant="secondary" onClick={() => setViewing(e)}>View analysis</DBtn>
                  </div>
                </div>
              );
            })}
            {entriesState === "loading" && <div className="text-sm text-[#98a2b3] py-4">Loading…</div>}
            {entriesState === "ready" && entriesOf(peopleFor.id).length === 0 && (
              <div className="text-sm text-[#98a2b3] py-4">No one has filled in this booth's analysis yet.</div>
            )}
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal
          title={`Analysis — ${viewing.name}`}
          subtitle={[viewing.email, viewing.phone, "saved " + savedLabel(viewing.savedAt)].filter(Boolean).join(" · ")}
          onClose={() => setViewing(null)}
          wide
        >
          <AnalysisView analysis={parseAnalysis(viewing.analysis)} />
          <div className="flex items-center justify-between gap-2 mt-6">
            <DBtn variant="danger" onClick={() => delEntry(viewing)}>Delete analysis</DBtn>
            <DBtn variant="secondary" onClick={() => setViewing(null)}>{peopleFor ? "← Back to people" : "Close"}</DBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}
