import { FileText, Phone, PhoneCall, Tag, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { dayDiff, initials, isFresh, shortDate, shortTime, today } from "../data";
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

const FOLLOWUP_TYPES: FollowUp["type"][] = ["Call", "Email", "Appointment", "Task"];

// A plain <input type="date"> is what was glitching (its native
// up/down-arrow step action snapping back to today in some browsers) —
// datetime-local is a different native control and doubles as the time
// picker, so one fix covers both complaints.
const toDatetimeLocal = (date: string, time?: string) => (date ? `${date}T${time || "00:00"}` : "");
const fromDatetimeLocal = (value: string): { dueDate: string; dueTime: string } => {
  const [dueDate, dueTime] = value.split("T");
  return { dueDate: dueDate || "", dueTime: dueTime || "" };
};

function whenLabel(r: FollowUp) {
  const d = dayDiff(r.dueDate);
  const base = d < 0 ? Math.abs(d) + "d overdue" : d === 0 ? "today" : "in " + d + "d";
  const time = r.dueTime ? " · " + shortTime(r.dueTime) : "";
  return r.status === "Completed" ? "done" : base + time;
}

export function FollowUpsScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [modal, setModal] = useState<FollowUp | null>(null);
  const [undo, setUndo] = useState<{ id: string; subject: string; prevDueDate: string; prevDueTime?: string; prevType: FollowUp["type"]; movedOut: boolean } | null>(null);
  const undoTimer = useRef<number | null>(null);
  const todayStr = today();

  const phoneOf = (prospectId: string) => db.prospects.find(p => p.id === prospectId)?.phone || "";

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
    { key: "dueDate", label: "Due", render: r => shortDate(r.dueDate) + (r.dueTime ? " · " + shortTime(r.dueTime) : ""), sortValue: r => r.dueDate },
    { key: "when", label: "When", render: whenLabel },
    { key: "subject", label: "Who / what", render: r => <span className="font-medium">{r.subject}</span>, sortValue: r => r.subject },
    { key: "phone", label: "Phone", render: r => phoneOf(r.prospectId) || "—", sortValue: r => phoneOf(r.prospectId) },
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
      key: "nextContact", label: "Next contact", render: r => (
        <div className="flex items-center gap-1.5">
          <select
            value={r.type}
            onChange={e => reschedule(r, { type: e.target.value as FollowUp["type"] })}
            className="h-8 px-1.5 rounded-lg border border-[#e5e5e5] bg-white text-[12px] text-[#0a0a0a] focus:outline-none focus:border-[#0070f3]"
          >
            {FOLLOWUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="datetime-local"
            value={toDatetimeLocal(r.dueDate, r.dueTime)}
            onChange={e => reschedule(r, fromDatetimeLocal(e.target.value))}
            className="h-8 px-2 rounded-lg border border-[#e5e5e5] bg-white text-[12px] text-[#0a0a0a] focus:outline-none focus:border-[#0070f3]"
          />
        </div>
      ),
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
  // Moves the follow-up's due date/time (and optionally what kind of
  // contact it is — call vs meeting, etc.) forward. A future date takes it
  // out of the Open board (see boardRows below) — it only reappears there
  // once that date arrives, and shows up on the Calendar/home Due list
  // meanwhile.
  const reschedule = (rec: FollowUp, next: { dueDate?: string; dueTime?: string; type?: FollowUp["type"] }) => {
    const dueDate = next.dueDate ?? rec.dueDate;
    const dueTime = next.dueTime ?? rec.dueTime;
    const type = next.type ?? rec.type;
    if (!dueDate || (dueDate === rec.dueDate && dueTime === rec.dueTime && type === rec.type)) return;
    const prevDueDate = rec.dueDate;
    const prevDueTime = rec.dueTime;
    const prevType = rec.type;
    const movedOut = rec.status === "Open" && dueDate > todayStr;
    const when = shortDate(dueDate) + (dueTime ? " " + shortTime(dueTime) : "");
    commit({ ...db, followUps: db.followUps.map(f => (f.id === rec.id ? { ...f, dueDate, dueTime, type } : f)) }, "Next contact for " + rec.subject + " set to " + when + " (" + type + ")");
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setUndo({ id: rec.id, subject: rec.subject, prevDueDate, prevDueTime, prevType, movedOut });
    undoTimer.current = window.setTimeout(() => setUndo(null), 5000);
  };
  const undoReschedule = () => {
    if (!undo) return;
    commit({ ...db, followUps: db.followUps.map(f => (f.id === undo.id ? { ...f, dueDate: undo.prevDueDate, dueTime: undo.prevDueTime, type: undo.prevType } : f)) }, "Undid reschedule for " + undo.subject);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setUndo(null);
  };

  // Open items only belong on the board once they're actually due — a
  // future "next contact" date moves them out until that day arrives.
  const boardRows = useMemo(
    () => sorted.filter(r => (r.status === "Completed" ? isFresh(r.completedAt) : r.dueDate <= todayStr)),
    [sorted, todayStr],
  );
  const completedHiddenCount = sorted.filter(r => r.status === "Completed" && !isFresh(r.completedAt)).length;
  const scheduledHiddenCount = sorted.filter(r => r.status === "Open" && r.dueDate > todayStr).length;

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

      {view === "board" && completedHiddenCount > 0 && (
        <p className="text-xs text-[#98a2b3] -mt-2">
          {completedHiddenCount} completed more than a day ago —{" "}
          <button onClick={() => setView("table")} className="underline hover:text-[#667085]">see them in Table</button>.
        </p>
      )}
      {view === "board" && scheduledHiddenCount > 0 && (
        <p className="text-xs text-[#98a2b3] -mt-2">
          {scheduledHiddenCount} scheduled for a later day — see them on the Calendar.
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
                {phoneOf(r.prospectId) && <CardRow icon={<PhoneCall size={14} />}>{phoneOf(r.prospectId)}</CardRow>}
                <CardRow icon={<Phone size={14} />}>
                  {r.contactCount ?? 0} contact{(r.contactCount ?? 0) === 1 ? "" : "s"}
                  {r.lastContactedAt ? " · last " + shortDate(r.lastContactedAt.slice(0, 10)) : ""}
                </CardRow>
                <CardPillButton onClick={() => logContact(r)}>Log contact</CardPillButton>
                <div onClick={e => e.stopPropagation()} className="flex flex-col gap-1.5 mt-0.5">
                  <label className="text-[11px] text-[#98a2b3] font-semibold">Next contact</label>
                  <select
                    value={r.type}
                    onChange={e => reschedule(r, { type: e.target.value as FollowUp["type"] })}
                    className="h-8 w-full px-2 rounded-lg border border-[#e5e5e5] bg-white text-[12px] text-[#0a0a0a] focus:outline-none focus:border-[#0070f3]"
                  >
                    {FOLLOWUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(r.dueDate, r.dueTime)}
                    onChange={e => reschedule(r, fromDatetimeLocal(e.target.value))}
                    className="h-8 w-full px-2 rounded-lg border border-[#e5e5e5] bg-white text-[12px] text-[#0a0a0a] focus:outline-none focus:border-[#0070f3]"
                  />
                </div>
              </>
            );
          }}
        />
      )}

      {modal && <RecordModal entityKey="followUps" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}

      {undo && (
        <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 bg-[#0a0a0a] text-white text-[13px] rounded-xl pl-4 pr-3 py-3 shadow-2xl">
          <span>{undo.movedOut ? <>Moved <strong>{undo.subject}</strong> out of Open</> : <>Updated next contact for <strong>{undo.subject}</strong></>}</span>
          <button onClick={undoReschedule} className="font-semibold text-[#8fc1ff] hover:text-white underline underline-offset-2 shrink-0">Undo</button>
        </div>
      )}
    </div>
  );
}
