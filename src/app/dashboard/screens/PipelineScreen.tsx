import { Clock, Mail, MapPin, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { dayDiff, initials, isFresh, shortDate, STAGES, STAGE_TITLES, today, uid } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { BoardCardHeader, BoardHint, BoardToggle, CardPillButton, CardRow, KanbanBoard, type BoardColumn } from "../Board";
import { DBtn, DCard, DInput } from "../ui";
import type { Db, FollowUp, Prospect, Stage } from "../types";

const DOTS: Record<Stage, string> = {
  NEW: "#3f7fe0",
  CONTACTED: "#8b5cf0",
  APPOINTMENT: "#e8a33d",
  "IN PROCESS": "#2f8f68",
  CONVERTED: "#14683f",
  "NOT INTERESTED": "#b4443a",
};

const COLUMNS: BoardColumn<Stage>[] = STAGES.map(s => ({ key: s, label: STAGE_TITLES[s], dot: DOTS[s] }));

// Converting too early (straight from New/Contacted) skips the funnel —
// only offer it once someone's actually worked through to In Process.
const CONVERTIBLE_STAGES: Stage[] = ["IN PROCESS", "CONVERTED"];

export function PipelineScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<Prospect | null>(null);
  const [selected, setSelected] = useState<Prospect | null>(null);

  const q = query.trim().toLowerCase();
  const visible = db.prospects.filter(p => !q || (p.name + p.need + p.source + p.agent).toLowerCase().includes(q));

  const columns: ColumnDef<Prospect>[] = [
    { key: "name", label: "Name", render: r => <span className="font-medium">{r.name}</span>, sortValue: r => r.name },
    { key: "stage", label: "Stage", render: r => <TagPill text={STAGE_TITLES[r.stage]} /> },
    { key: "need", label: "Need", render: r => r.need },
    { key: "source", label: "Source", render: r => r.source },
    { key: "agent", label: "Agent", render: r => r.agent },
    { key: "email", label: "Email", render: r => r.email },
    { key: "phone", label: "Phone", render: r => r.phone },
    { key: "lastContact", label: "Last contact", render: r => shortDate(r.lastContact), sortValue: r => r.lastContact },
  ];

  // Stamps/clears completedAt when the stage crosses into/out of a terminal
  // one (Converted or Not Interested), so the board can drop it off after
  // 24h while Table still shows it.
  const isTerminal = (s: Stage) => s === "CONVERTED" || s === "NOT INTERESTED";
  const applyCompletion = (rec: Prospect, prevStage?: Stage): Prospect => {
    const was = prevStage !== undefined && isTerminal(prevStage);
    const is = isTerminal(rec.stage);
    if (is && !was) return { ...rec, completedAt: new Date().toISOString() };
    if (!is && was) return { ...rec, completedAt: undefined };
    return rec;
  };

  const save = (rec: Prospect) => {
    const prev = db.prospects.find(r => r.id === rec.id);
    const finalRec = applyCompletion(rec, prev?.stage);
    const list = db.prospects.slice();
    const i = list.findIndex(r => r.id === finalRec.id);
    if (i >= 0) list[i] = finalRec; else list.unshift(finalRec);
    setModal(null);
    commit({ ...db, prospects: list }, (i >= 0 ? "Saved " : "Added ") + finalRec.name);
  };
  const del = (rec: Prospect) => {
    if (!window.confirm("Delete this record?")) return;
    setSelected(null);
    commit({ ...db, prospects: db.prospects.filter(r => r.id !== rec.id) }, "Record deleted");
  };
  const moveStage = (rec: Prospect, stage: Stage) => {
    const finalRec = applyCompletion({ ...rec, stage }, rec.stage);
    commit({ ...db, prospects: db.prospects.map(p => (p.id === rec.id ? finalRec : p)) }, rec.name + " → " + STAGE_TITLES[stage]);
  };
  const addFollowUp = (p: Prospect) => {
    const fu: FollowUp = { id: uid(), prospectId: p.id, subject: p.name, type: "Call", dueDate: today(), status: "Open", note: "", agent: p.agent, contactCount: 0 };
    commit({ ...db, followUps: [fu, ...db.followUps] }, p.name + " added to Follow-Ups");
  };
  const convert = (rec: Prospect, type: "Client" | "Partner" | "Both") => {
    const exists = db.clients.find(c => c.name.trim().toLowerCase() === rec.name.trim().toLowerCase());
    const clients = exists ? db.clients : [{ id: rec.id + "-c", name: rec.name, email: rec.email, phone: rec.phone, address: "", type, agent: rec.agent, source: rec.source, since: new Date().toISOString().slice(0, 10) }, ...db.clients];
    const prospects = db.prospects.map(p => (p.id === rec.id ? applyCompletion({ ...p, stage: "CONVERTED" as Stage }, p.stage) : p));
    setSelected(null);
    commit({ ...db, clients, prospects }, rec.name + " converted to " + type.toLowerCase());
  };

  const boardRows = useMemo(() => visible.filter(p => !isTerminal(p.stage) || isFresh(p.completedAt)), [visible]);
  const hiddenCount = visible.length - boardRows.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Sales</div>
          <h2 className="text-2xl font-black mt-0.5">Prospect Pipeline</h2>
          <p className="text-sm text-[#667085] mt-1">New to Converted, on the stages from your workflow.</p>
        </div>
        <div className="flex items-center gap-2">
          <DInput placeholder="Search prospects..." value={query} onChange={e => setQuery(e.target.value)} className="w-56" />
          <DBtn onClick={() => setModal(blankRecord("prospects"))}>+ New prospect</DBtn>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <BoardToggle view={view} onChange={setView} />
        {view === "board" && <BoardHint />}
      </div>

      {view === "board" && hiddenCount > 0 && (
        <p className="text-xs text-[#98a2b3] -mt-2">
          {hiddenCount} closed more than a day ago —{" "}
          <button onClick={() => setView("table")} className="underline hover:text-[#667085]">see them in Table</button>.
        </p>
      )}

      {view === "table" ? (
        <RecordTable<Prospect> rows={visible} columns={columns} onEdit={setModal} onDelete={del} searchable={false} />
      ) : (
        <KanbanBoard<Prospect, Stage>
          columns={COLUMNS}
          rows={boardRows}
          getColumn={r => r.stage}
          onMove={moveStage}
          onAdd={stage => setModal({ ...blankRecord("prospects"), stage })}
          onOpen={setSelected}
          countNoun="LEAD"
          renderCard={(p, col) => {
            const eventName = db.events.find(e => e.id === p.eventId)?.name;
            const fus = db.followUps.filter(f => f.prospectId === p.id);
            const done = fus.filter(f => f.status === "Completed").length;
            const d = dayDiff(p.lastContact);
            return (
              <>
                <BoardCardHeader
                  avatarText={initials(p.name)}
                  avatarSeed={p.id}
                  dotColor={col.dot}
                  title={p.name}
                  subtitle={d === 0 ? "today" : d < 0 ? Math.abs(d) + "d ago" : "in " + d + "d"}
                  onDelete={() => del(p)}
                />
                {(eventName || p.source) && <CardRow icon={<MapPin size={14} />}>{[eventName, p.source].filter(Boolean).join(" · ")}</CardRow>}
                {p.need && <CardRow icon={<TrendingUp size={14} />}>Interested in {p.need}</CardRow>}
                {fus.length > 0 && <CardRow icon={<Clock size={14} />}>{fus.length} scheduled, {done > 0 ? done + " done" : "none done yet"}</CardRow>}
                {p.email && <CardRow icon={<Mail size={14} />}>{p.email}</CardRow>}
                <CardPillButton onClick={() => addFollowUp(p)}>+ Follow-up</CardPillButton>
              </>
            );
          }}
        />
      )}

      {selected && (
        <DCard className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#98a2b3]">Prospect record</div>
            <h3 className="text-lg font-bold mt-1">{selected.name}</h3>
            <div className="text-[13px] leading-7 mt-2">
              <div>{selected.email}</div>
              <div>{selected.phone}</div>
              <div>Source · {selected.source}</div>
              <div>Need · {selected.need}</div>
              <div>Agent · {selected.agent}</div>
              <div>Last contact · {shortDate(selected.lastContact)}</div>
            </div>
          </div>
          <div>
            <h5 className="text-xs uppercase tracking-wider text-[#98a2b3] mb-1.5">Notes</h5>
            <p className="text-[13px] text-[#344054]">{selected.notes || "No notes yet."}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold mb-1">Stage · {STAGE_TITLES[selected.stage]}</div>
            {selected.stage !== "CONVERTED" && (
              <DBtn onClick={() => { const idx = STAGES.indexOf(selected.stage); const next = STAGES[Math.min(idx + 1, 4)]; moveStage(selected, next); setSelected({ ...selected, stage: next }); }}>
                Advance to {STAGE_TITLES[STAGES[Math.min(STAGES.indexOf(selected.stage) + 1, 4)]]}
              </DBtn>
            )}
            <DBtn variant="secondary" onClick={() => addFollowUp(selected)}>Add to Follow-Ups</DBtn>
            {CONVERTIBLE_STAGES.includes(selected.stage) && (
              <>
                <DBtn variant="secondary" onClick={() => convert(selected, "Client")}>Convert to Client</DBtn>
                <DBtn variant="secondary" onClick={() => convert(selected, "Partner")}>Convert to Partner</DBtn>
              </>
            )}
            <DBtn variant="secondary" onClick={() => setModal(selected)}>Edit record</DBtn>
            <DBtn variant="danger" onClick={() => del(selected)}>Delete contact</DBtn>
            <DBtn variant="ghost" onClick={() => setSelected(null)}>Close</DBtn>
          </div>
        </DCard>
      )}

      {modal && <RecordModal entityKey="prospects" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}
    </div>
  );
}
