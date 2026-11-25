import { useEffect, useRef, useState } from "react";
import { DInput } from "./ui";
import { normName } from "./people";
import type { Prospect } from "./types";

// A name box that drops down matching people (prospects and clients) as you
// type. Typing keeps it a free-text name; picking a suggestion calls onPick.
// Dashboard only — the client's public form never gets the people list.
export function PersonAutocomplete({
  value, onChange, people, onPick, placeholder, autoFocus,
}: {
  value: string;
  onChange: (text: string) => void;
  people: Prospect[];
  onPick: (p: Prospect) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const q = normName(value);
  // Names starting with what's typed come first, then any other match on
  // name or email.
  const matches = q
    ? people
        .filter(p => normName(p.name).includes(q) || (p.email || "").toLowerCase().includes(q))
        .sort((a, b) => Number(!normName(b.name).startsWith(q)) - Number(!normName(a.name).startsWith(q)) || a.name.localeCompare(b.name))
        .slice(0, 8)
    : [];
  const show = open && matches.length > 0;

  const pick = (p: Prospect) => { onPick(p); setOpen(false); };

  return (
    <div ref={wrapRef} className="relative">
      <DInput
        value={value}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!show) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(i + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); pick(matches[active]); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      {show && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-[#e5e5e5] rounded-xl shadow-lg py-1">
          <div className="px-3 pt-1.5 pb-1 text-[10px] uppercase tracking-wider text-[#98a2b3]">In your records</div>
          {matches.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(p)}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 ${i === active ? "bg-[#f2f4f7]" : ""}`}
            >
              <TypeBadge person={p} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{p.name}</span>
                <span className="block text-xs text-[#98a2b3] truncate">{[p.email, p.phone].filter(Boolean).join(" · ") || "No contact details"}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// "Prospect" or "Client" / "Partner" / "Both", shown in front of a name.
export function TypeBadge({ person }: { person: Prospect }) {
  return (
    <span className={`shrink-0 w-[68px] text-center text-[11px] font-semibold px-2 py-0.5 rounded-full ${person.clientType ? "bg-[#f1eefb] text-[#5341a6]" : "bg-[#eaf1f9] text-[#141a20]"}`}>
      {person.clientType || "Prospect"}
    </span>
  );
}
