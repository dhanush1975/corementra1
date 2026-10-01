import { FileText, Phone, Tag, User } from "lucide-react";
import { useMemo, useState } from "react";
import { dayDiff, initials, isFresh, shortDate } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { BoardCardHeader, BoardHint, BoardToggle, CardPillButton, CardRow, KanbanBoard, MiniBadge, type BoardColumn } from "../Board";
import { DBtn } from "../ui";
import type { Db, FollowUp } from "../types";

const COLUMNS: BoardColumn<FollowUp["status"]>[] = [
  { key: "Open", label: "Open", dot: "#3f7fe0" },
  { key: "Completed", label: "Completed", dot: "#8b5cf0" },
];

function whenLabel(r: FollowUp) {
  const d = dayDiff(r.dueDate);
  return r.status === "Completed" ? "done" : d < 0 ? Math.abs(d) + "d overdue" : d === 0 ? "today" : "in " + d + "d";
}

export function FollowUpsScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [modal, setModal] = useState<FollowUp | null>(null);

  const sorted = db.followUps.slice().sort((a, b) => (a.status === b.status ? a.dueDate.localeCompare(b.dueDate) : a.status === "Open" ? -1 : 1));

  // Stamps/clears completedAt when status crosses into/out of "Completed",
  // so the board can drop it off after 24h while Table still shows it.
  const applyCompletion = (rec: FollowUp, prevStatus?: FollowUp["status"]): FollowUp => {
    const was = prevStatus === "Completed";
    const is = rec.status === "Completed";
    if (is && !was) return { ...rec, completedAt: new Date().toISOString() };
    if (!is && was) return { ...rec, completedAt: undefined };
    return rec;
  };

  const columns: ColumnDef<FollowUp>[] = [
    { key: "dueDate", label: "Due", render: r => shortDate(r.dueDate), sortValue: r => r.dueDate },
    { key: "when", label: "When", render: whenLabel },
    { key: "subject", label: "Who / what", render: r => <span className="font-medium">{r.subject}</span>, sortValue: r => r.subject },
    { key: "type", label: "Type", render: r => <TagPill text={r.type} /> },
    { key: "note", label: "Note", render: r => <span className="text-[#667085]">{r.note}</span> },
    { key: "agent", label: "Agent", render: r => r.agent },
    {
      key: "contacts", label: "Contacts", render: r => (
        <button onClick={() => logContact(r)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1c3a5e] hover:underline" title="Log a contact">
          {r.contactCount ?? 0}× <span className="text-[11px] text-[#98a2b3] font-normal">+1</span>
        </button>
      ), sortValue: r => r.contactCount ?? 0,
    },
    {
      key: "status", label: "Status", render: r => (
        <button onClick={() => {
          const finalRec = applyCompletion({ ...r, status: r.status === "Open" ? "Completed" : "Open" }, r.status);
          commit({ ...db, followUps: db.followUps.map(f => (f.id === r.id ? finalRec : f)) }, r.status === "Open" ? "Marked complete" : "Marked open");
        }}>
          <TagPill text={r.status} />
        </button>
      ),
    },
  ];

  const save = (rec: FollowUp) => {
    const prev = db.followUps.find(r => r.id === rec.id);
    const finalRec = applyCompletion(rec, prev?.status);
    const list = db.followUps.slice();
    const i = list.findIndex(r => r.id === finalRec.id);
    if (i >= 0) list[i] = finalRec; else list.unshift(finalRec);
    setModal(null);
    commit({ ...db, followUps: list }, (i >= 0 ? "Saved " : "Added ") + finalRec.subject);
  };
  const del = (rec: FollowUp) => {
    if (!window.confirm("Delete this follow-up?")) return;
    commit({ ...db, followUps: db.followUps.filter(r => r.id !== rec.id) }, "Deleted");
  };
  const moveStatus = (rec: FollowUp, status: FollowUp["status"]) => {
    const finalRec = applyCompletion({ ...rec, status }, rec.status);
    commit({ ...db, followUps: db.followUps.map(f => (f.id === rec.id ? finalRec : f)) }, rec.subject + " → " + status);
  };
  const logContact = (rec: FollowUp) => {
    const updated = { ...rec, contactCount: (rec.contactCount ?? 0) + 1, lastContactedAt: new Date().toISOString() };
    commit({ ...db, followUps: db.followUps.map(f => (f.id === rec.id ? updated : f)) }, "Logged contact with " + rec.subject);
  };

  const boardRows = useMemo(() => sorted.filter(r => r.status !== "Completed" || isFresh(r.completedAt)), [sorted]);
  const hiddenCount = sorted.length - boardRows.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Sales</div>
          <h2 className="text-2xl font-black mt-0.5">Follow-Up Workspace</h2>
          <p className="text-sm text-[#667085] mt-1">Overdue first, then today, then scheduled.</p>
        </div>
        <DBtn onClick={() => setModal(blankRecord("followUps"))}>+ New follow-up</DBtn>
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
        <RecordTable<FollowUp> rows={sorted} columns={columns} onEdit={setModal} onDelete={del} searchFn={(r, q) => (r.subject + r.note + r.agent).toLowerCase().includes(q)} />
      ) : (
        <KanbanBoard<FollowUp, FollowUp["status"]>
          columns={COLUMNS}
          rows={boardRows}
          getColumn={r => r.status}
          onMove={moveStatus}
          onAdd={status => setModal({ ...blankRecord("followUps"), status })}
          onOpen={setModal}
          countNoun="TASK"
          renderCard={(r, col) => {
            const isClient = db.clients.some(c => c.name === r.subject);
            return (
              <>
                <BoardCardHeader
                  avatarText={initials(r.subject)}
                  avatarSeed={r.id}
                  dotColor={col.dot}
                  title={r.subject}
                  badge={<MiniBadge text={isClient ? "CLIENT" : "PROSPECT"} tone={isClient ? "purple" : "blue"} />}
                  subtitle={whenLabel(r)}
                  onDelete={() => del(r)}
                />
                <CardRow icon={<Tag size={14} />}>{r.type}</CardRow>
                <CardRow icon={<FileText size={14} />}>{r.note}</CardRow>
                <CardRow icon={<User size={14} />}>{r.agent}</CardRow>
                <CardRow icon={<Phone size={14} />}>
                  {r.contactCount ?? 0} contact{(r.contactCount ?? 0) === 1 ? "" : "s"}
                  {r.lastContactedAt ? " · last " + shortDate(r.lastContactedAt.slice(0, 10)) : ""}
                </CardRow>
                <CardPillButton onClick={() => logContact(r)}>Log contact</CardPillButton>
              </>
            );
          }}
        />
      )}

      {modal && <RecordModal entityKey="followUps" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}
    </div>
  );
}
