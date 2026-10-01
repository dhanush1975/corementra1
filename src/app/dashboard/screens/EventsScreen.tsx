import { Clock, MapPin, CreditCard } from "lucide-react";
import { useMemo, useState } from "react";
import { initials, isFresh, money, shortDate } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { BoardCardHeader, BoardHint, BoardToggle, CardPillButton, CardRow, KanbanBoard, type BoardColumn } from "../Board";
import { DBtn, Modal } from "../ui";
import type { Db, EventRecord } from "../types";

const COLUMNS: BoardColumn<EventRecord["status"]>[] = [
  { key: "Upcoming", label: "Upcoming", dot: "#3f7fe0" },
  { key: "Completed", label: "Completed", dot: "#8b5cf0" },
];

export function EventsScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [modal, setModal] = useState<EventRecord | null>(null);
  const [peopleFor, setPeopleFor] = useState<EventRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (r: EventRecord) => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${r.id}`).then(() => {
      setCopiedId(r.id);
      window.setTimeout(() => setCopiedId(id => (id === r.id ? null : id)), 1800);
    });
  };

  const columns: ColumnDef<EventRecord>[] = [
    { key: "name", label: "Event", render: r => <span className="font-medium">{r.name}</span>, sortValue: r => r.name },
    { key: "date", label: "Date", render: r => shortDate(r.date), sortValue: r => r.date },
    { key: "location", label: "Location", render: r => r.location },
    { key: "registered", label: "Registered", render: r => r.registered, sortValue: r => r.registered },
    { key: "attended", label: "Attended", render: r => r.attended, sortValue: r => r.attended },
    { key: "prospects", label: "Prospects", render: r => db.prospects.filter(p => p.eventId === r.id).length },
    { key: "expense", label: "Expense", render: r => money(r.expense), sortValue: r => r.expense },
    { key: "status", label: "Status", render: r => <TagPill text={r.status} /> },
  ];

  // Stamps/clears completedAt when status crosses into/out of "Completed",
  // so the board can drop it off after 24h while Table still shows it.
  const applyCompletion = (rec: EventRecord, prevStatus?: EventRecord["status"]): EventRecord => {
    const was = prevStatus === "Completed";
    const is = rec.status === "Completed";
    if (is && !was) return { ...rec, completedAt: new Date().toISOString() };
    if (!is && was) return { ...rec, completedAt: undefined };
    return rec;
  };

  const save = (rec: EventRecord) => {
    const prev = db.events.find(r => r.id === rec.id);
    const finalRec = applyCompletion(rec, prev?.status);
    const list = db.events.slice();
    const i = list.findIndex(r => r.id === finalRec.id);
    if (i >= 0) list[i] = finalRec; else list.unshift(finalRec);
    setModal(null);
    commit({ ...db, events: list }, (i >= 0 ? "Saved " : "Added ") + finalRec.name);
  };
  const del = (rec: EventRecord) => {
    if (!window.confirm("Delete this event?")) return;
    commit({ ...db, events: db.events.filter(r => r.id !== rec.id) }, "Event deleted");
  };
  const moveStatus = (rec: EventRecord, status: EventRecord["status"]) => {
    const finalRec = applyCompletion({ ...rec, status }, rec.status);
    commit({ ...db, events: db.events.map(e => (e.id === rec.id ? finalRec : e)) }, rec.name + " → " + status);
  };

  const boardRows = useMemo(() => db.events.filter(r => r.status !== "Completed" || isFresh(r.completedAt)), [db.events]);
  const hiddenCount = db.events.length - boardRows.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Operations</div>
          <h2 className="text-2xl font-black mt-0.5">Event Management</h2>
          <p className="text-sm text-[#667085] mt-1">Every event, what it cost and what it produced.</p>
        </div>
        <DBtn onClick={() => setModal(blankRecord("events"))}>+ New event</DBtn>
      </div>

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
        <RecordTable<EventRecord> rows={db.events} columns={columns} onEdit={setModal} onDelete={del} searchFn={(r, q) => (r.name + r.location).toLowerCase().includes(q)} />
      ) : (
        <KanbanBoard<EventRecord, EventRecord["status"]>
          columns={COLUMNS}
          rows={boardRows}
          getColumn={r => r.status}
          onMove={moveStatus}
          onAdd={status => setModal({ ...blankRecord("events"), status })}
          onOpen={setModal}
          countNoun="EVENT"
          renderCard={(r, col) => {
            const peopleCount = db.prospects.filter(p => p.eventId === r.id).length;
            return (
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
                  <CardPillButton onClick={() => setPeopleFor(r)}>View people ({peopleCount})</CardPillButton>
                  <CardPillButton onClick={() => copyLink(r)}>{copiedId === r.id ? "Copied!" : "Copy link"}</CardPillButton>
                </div>
                <CardRow icon={<MapPin size={14} />}>{r.location}</CardRow>
                <CardRow icon={<Clock size={14} />}>{r.timeFrame}</CardRow>
                <CardRow icon={<CreditCard size={14} />}>{money(r.expense)} expense · {r.attended} attended</CardRow>
              </>
            );
          }}
        />
      )}

      {modal && <RecordModal entityKey="events" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}

      {peopleFor && (
        <Modal title={`People — ${peopleFor.name}`} subtitle={shortDate(peopleFor.date)} onClose={() => setPeopleFor(null)}>
          <div className="flex flex-col gap-2">
            {db.prospects.filter(p => p.eventId === peopleFor.id).map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2 border-b border-[#f4f5f7] last:border-0">
                <div>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-[#98a2b3]">{p.email}</div>
                </div>
                <TagPill text={p.stage} />
              </div>
            ))}
            {db.prospects.filter(p => p.eventId === peopleFor.id).length === 0 && <div className="text-sm text-[#98a2b3] py-4">No one linked to this event yet.</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
