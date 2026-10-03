import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { monthGrid, shortDate, shortTime, today } from "./data";

// Custom date+time popover styled to match the Calendly picker elsewhere
// on the site (circular day cells, solid-blue selected day) — used in
// place of a native <input type="date">, whose popup can't be restyled
// and whose up/down-arrow step action was snapping back to today.
export function DateTimePicker({
  date,
  time,
  onApply,
  placeholder = "Pick a date",
}: {
  date: string;
  time?: string;
  onApply: (date: string, time: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = date ? new Date(date + "T00:00:00") : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [draftDate, setDraftDate] = useState(date);
  const [draftTime, setDraftTime] = useState(time || "");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const todayStr = today();

  const openPicker = () => {
    setDraftDate(date);
    setDraftTime(time || "");
    const d = date ? new Date(date + "T00:00:00") : new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const left = Math.min(rect.left, window.innerWidth - 300);
      setPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node) || triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = monthGrid(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const apply = () => {
    if (!draftDate) return;
    onApply(draftDate, draftTime);
    setOpen(false);
  };

  const label = date ? shortDate(date) + (time ? " · " + shortTime(time) : "") : placeholder;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={e => { e.stopPropagation(); open ? setOpen(false) : openPicker(); }}
        className="h-8 w-full px-2.5 rounded-lg border border-[#e5e5e5] bg-white text-[12px] text-[#0a0a0a] hover:border-[#0070f3] transition-colors text-left truncate"
      >
        {label}
      </button>
      {open && pos && createPortal(
        <div
          ref={popRef}
          onClick={e => e.stopPropagation()}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 1000 }}
          className="w-[280px] bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold">{monthLabel}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() - 1, 1))} className="w-7 h-7 rounded-full flex items-center justify-center text-[#667085] hover:bg-[#f5f5f5] transition-colors">‹</button>
              <button type="button" onClick={() => setCursor(c => new Date(c.getFullYear(), c.getMonth() + 1, 1))} className="w-7 h-7 rounded-full flex items-center justify-center text-[#667085] hover:bg-[#f5f5f5] transition-colors">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#98a2b3] mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <div key={i}>{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map(c => {
              const isSelected = c.dateStr === draftDate;
              const isToday = c.dateStr === todayStr;
              return (
                <div key={c.dateStr} className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setDraftDate(c.dateStr)}
                    className={`w-8 h-8 rounded-full text-[12px] font-semibold transition-colors flex items-center justify-center
                      ${isSelected ? "bg-[#0070f3] text-white" : isToday ? "border border-[#0070f3] text-[#0070f3]" : c.inMonth ? "text-[#344054] hover:bg-[#f5f5f5]" : "text-[#d0d5dd]"}`}
                  >
                    {c.date.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#f0f2f5]">
            <input
              type="time"
              value={draftTime}
              onChange={e => setDraftTime(e.target.value)}
              className="h-8 flex-1 min-w-0 px-2 rounded-lg border border-[#e5e5e5] text-[12px] focus:outline-none focus:border-[#0070f3]"
            />
            <button type="button" onClick={apply} className="h-8 px-3 rounded-lg bg-[#0070f3] text-white text-[12px] font-semibold shrink-0 hover:bg-[#0060d3] transition-colors">Done</button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
