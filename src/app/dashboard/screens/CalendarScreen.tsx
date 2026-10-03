import { useMemo, useState } from "react";
import { shortDate, today } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { DBtn, DCard, EmptyState, Pill } from "../ui";
import type { Db, FollowUp } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n: number) => String(n).padStart(2, "0");
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Always 42 cells (6 full weeks) so the grid height never jumps between months.
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { date: Date; dateStr: string; inMonth: boolean }[] = [];
  for (let i = first.getDay(); i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    cells.push({ date: d, dateStr: toDateStr(d), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d);
    cells.push({ date: dt, dateStr: toDateStr(dt), inMonth: true });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: d, dateStr: toDateStr(d), inMonth: false });
  }
  return cells;
}

export function CalendarScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const todayStr = today();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(todayStr + "T00:00:00");
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayStr);
  const [modal, setModal] = useState<FollowUp | null>(null);

  // Appointments are just follow-ups of type "Appointment" — no separate
  // model needed, this is the same FollowUp.dueDate every other screen uses.
  const byDate = useMemo(() => {
    const map: Record<string, FollowUp[]> = {};
    db.followUps.forEach(f => {
      if (!f.dueDate) return;
      (map[f.dueDate] ||= []).push(f);
    });
    return map;
  }, [db.followUps]);

  const cells = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const goMonth = (delta: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  const goToday = () => {
    const d = new Date(todayStr + "T00:00:00");
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelected(todayStr);
  };

  const selectedItems = byDate[selected] || [];
  const appointments = selectedItems.filter(f => f.type === "Appointment");
  const followUps = selectedItems.filter(f => f.type !== "Appointment");

  const save = (rec: FollowUp) => {
    const list = db.followUps.slice();
    const i = list.findIndex(r => r.id === rec.id);
    if (i >= 0) list[i] = rec; else list.unshift(rec);
    setModal(null);
    commit({ ...db, followUps: list }, (i >= 0 ? "Saved " : "Added ") + rec.subject);
  };
  const del = (rec: FollowUp) => {
    if (!window.confirm("Delete this record?")) return;
    setModal(null);
    commit({ ...db, followUps: db.followUps.filter(r => r.id !== rec.id) }, "Deleted");
  };
  const toggleStatus = (rec: FollowUp) => {
    const status = rec.status === "Open" ? "Completed" : "Open";
    commit(
      { ...db, followUps: db.followUps.map(f => (f.id === rec.id ? { ...f, status, completedAt: status === "Completed" ? new Date().toISOString() : undefined } : f)) },
      status === "Completed" ? "Marked complete" : "Marked open",
    );
  };

  const Row = ({ r }: { r: FollowUp }) => (
    <button onClick={() => setModal(r)} className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors">
      <span
        onClick={e => { e.stopPropagation(); toggleStatus(r); }}
        className={`w-4 h-4 rounded-full border shrink-0 ${r.status === "Completed" ? "bg-[#14683f] border-[#14683f]" : "border-[#d0d5dd]"}`}
      />
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${r.status === "Completed" ? "line-through text-[#98a2b3]" : ""}`}>{r.subject}</div>
        <div className="text-xs text-[#98a2b3] truncate">{r.agent}{r.note ? " · " + r.note : ""}</div>
      </div>
      <Pill tone={r.type === "Appointment" ? "purple" : "blue"}>{r.type}</Pill>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Sales</div>
          <h2 className="text-2xl font-black mt-0.5">Calendar</h2>
          <p className="text-sm text-[#667085] mt-1">Follow-ups and appointments by day.</p>
        </div>
        <DBtn onClick={() => setModal({ ...blankRecord("followUps"), dueDate: selected })}>+ New for {shortDate(selected)}</DBtn>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        <DCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold">{monthLabel}</h3>
            <div className="flex items-center gap-1.5">
              <DBtn variant="secondary" onClick={() => goMonth(-1)}>←</DBtn>
              <DBtn variant="secondary" onClick={goToday}>Today</DBtn>
              <DBtn variant="secondary" onClick={() => goMonth(1)}>→</DBtn>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#98a2b3] mb-1">
            {WEEKDAYS.map(w => <div key={w} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map(c => {
              const items = byDate[c.dateStr] || [];
              const apptCount = items.filter(f => f.type === "Appointment").length;
              const fuCount = items.length - apptCount;
              const isSelected = c.dateStr === selected;
              const isToday = c.dateStr === todayStr;
              return (
                <button
                  key={c.dateStr}
                  onClick={() => setSelected(c.dateStr)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-[13px] transition-colors
                    ${isSelected ? "bg-[#0a0a0a] text-white" : isToday ? "bg-[#eaf1f9] text-[#141a20]" : c.inMonth ? "hover:bg-[#f5f5f5] text-[#0a0a0a]" : "text-[#c1c7d0] hover:bg-[#f5f5f5]"}`}
                >
                  <span className="font-semibold">{c.date.getDate()}</span>
                  {(apptCount > 0 || fuCount > 0) && (
                    <span className="flex items-center gap-0.5">
                      {apptCount > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "#8b5cf0" }} />}
                      {fuCount > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? "#fff" : "#3f7fe0" }} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DCard>

        <DCard className="p-4 flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold">{shortDate(selected)}</h4>
            <p className="text-xs text-[#98a2b3]">{selectedItems.length} scheduled</p>
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-wider text-[#98a2b3] mb-1.5">Appointments</h5>
            {appointments.length ? <div className="flex flex-col gap-0.5">{appointments.map(r => <Row key={r.id} r={r} />)}</div> : <EmptyState>No appointments this day.</EmptyState>}
          </div>

          <div>
            <h5 className="text-[11px] uppercase tracking-wider text-[#98a2b3] mb-1.5">Follow-Ups</h5>
            {followUps.length ? <div className="flex flex-col gap-0.5">{followUps.map(r => <Row key={r.id} r={r} />)}</div> : <EmptyState>No follow-ups this day.</EmptyState>}
          </div>
        </DCard>
      </div>

      {modal && <RecordModal entityKey="followUps" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}
    </div>
  );
}
