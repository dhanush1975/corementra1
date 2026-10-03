import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { monthGrid, shortDate, shortTime, today } from "./data";

// Every 30 minutes across the day, like Calendly's time-slot list.
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

// Custom date+time popover styled to match the Calendly picker elsewhere
// on the site (circular day cells, solid-blue selected day, scrollable
// time-slot list) — used in place of a native <input type="date">, whose
// popup can't be restyled, whose up/down-arrow step action was snapping
// back to today, and which had no time selection at all. Positions itself
// (and flips above the trigger when there's no room below) so it's always
// fully visible without having to scroll the page to reach it.
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
    setOpen(true);
  };

  // Measure the popover after it renders and flip it above the trigger
  // (instead of below) if there isn't room — this is what keeps it fully
  // on-screen without needing to scroll the page to see the rest of it.
  useLayoutEffect(() => {
    if (!open || !popRef.current || !triggerRef.current) return;
    const place = () => {
      if (!popRef.current || !triggerRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popRect = popRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      const top = popRect.height + 10 <= spaceBelow || spaceBelow >= spaceAbove
        ? Math.min(triggerRect.bottom + 6, window.innerHeight - popRect.height - 8)
        : Math.max(8, triggerRect.top - popRect.height - 6);
      const left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - popRect.width - 8));
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  useLayoutEffect(() => {
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

  const pickTime = (t: string) => {
    setDraftTime(t);
    if (draftDate) {
      onApply(draftDate, t);
      setOpen(false);
    }
  };
  const applyDateOnly = () => {
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
      {open && createPortal(
        <div
          ref={popRef}
          onClick={e => e.stopPropagation()}
          style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden", zIndex: 1000 }}
          className="flex bg-white rounded-2xl shadow-2xl border border-[#e5e5e5] overflow-hidden"
        >
          <div className="p-4 w-[260px]">
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
            <button type="button" onClick={applyDateOnly} className="w-full h-8 mt-3 rounded-lg border border-[#e5e5e5] text-[12px] font-semibold text-[#344054] hover:bg-[#f5f5f5] transition-colors">
              Use date only{draftTime ? " (keep " + shortTime(draftTime) + ")" : ""}
            </button>
          </div>
          <div className="w-[136px] border-l border-[#f0f2f5] p-3 flex flex-col">
            <div className="text-[11px] font-semibold text-[#98a2b3] uppercase tracking-wide mb-2 px-1">Time</div>
            <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1 max-h-[340px]">
              {TIME_SLOTS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickTime(t)}
                  className={`shrink-0 px-2 py-2 rounded-lg border text-[12px] font-bold text-center transition-colors
                    ${draftTime === t ? "bg-[#0070f3] border-[#0070f3] text-white" : "border-[#c7d7fb] text-[#0070f3] hover:bg-[#f5f9ff]"}`}
                >
                  {shortTime(t)}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
