import { useEffect, useRef, useState } from "react";
import { DInput } from "./ui";

// A searchable dropdown for long option lists (e.g. 468 products) where a
// plain <select> makes finding anything by scrolling impractical. Options
// are always shown sorted by label.
export function SearchSelect<T extends { id: string }>({
  options,
  value,
  labelOf,
  onSelect,
  placeholder = "Search...",
}: {
  options: T[];
  value: string;
  labelOf: (o: T) => string;
  onSelect: (o: T) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = options.find(o => o.id === value);
  const sorted = options.slice().sort((a, b) => labelOf(a).localeCompare(labelOf(b)));
  const q = query.trim().toLowerCase();
  const filtered = (q ? sorted.filter(o => labelOf(o).toLowerCase().includes(q)) : sorted).slice(0, 150);

  return (
    <div ref={wrapRef} className="relative">
      <DInput
        placeholder={placeholder}
        value={open ? query : selected ? labelOf(selected) : ""}
        onFocus={() => { setOpen(true); setQuery(""); }}
        onChange={e => setQuery(e.target.value)}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-[#e5e5e5] rounded-xl shadow-lg">
          {filtered.length === 0 && <div className="px-3 py-2 text-sm text-[#98a2b3]">No matches</div>}
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onSelect(o); setOpen(false); setQuery(""); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[#f5f5f5] transition-colors"
            >
              {labelOf(o)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
