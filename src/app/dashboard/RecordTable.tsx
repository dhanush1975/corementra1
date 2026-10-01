import { useMemo, useState } from "react";
import { DBtn, DCard, DInput, EmptyState, Pill } from "./ui";

export type ColumnDef<T> = {
  label: string;
  key: string;
  render: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

export function RecordTable<T extends { id: string }>({
  rows,
  columns,
  onEdit,
  onDelete,
  searchable = true,
  searchFn,
}: {
  rows: T[];
  columns: ColumnDef<T>[];
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  searchable?: boolean;
  searchFn?: (row: T, q: string) => boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = !q ? rows : rows.filter(r => (searchFn ? searchFn(r, q) : JSON.stringify(r).toLowerCase().includes(q)));
    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      list = [...list].sort((a, b) => {
        const va = col?.sortValue ? col.sortValue(a) : "";
        const vb = col?.sortValue ? col.sortValue(b) : "";
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        return cmp * sortDir;
      });
    }
    return list;
  }, [rows, query, sortKey, sortDir, columns, searchFn]);

  return (
    <DCard className="p-5">
      {searchable && (
        <div className="mb-4">
          <DInput placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="max-w-[280px]" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[#98a2b3] border-b border-[#eef0f3]">
              {columns.map(c => (
                <th
                  key={c.key}
                  className="text-left font-medium py-2 pr-4 cursor-pointer select-none whitespace-nowrap"
                  onClick={() => { setSortKey(c.key); setSortDir(d => (sortKey === c.key ? -d : 1)); }}
                >
                  {c.label}{sortKey === c.key ? (sortDir === 1 ? " ↑" : " ↓") : ""}
                </th>
              ))}
              <th className="text-right font-medium py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b border-[#f4f5f7] last:border-0">
                {columns.map(c => (
                  <td key={c.key} className="py-2.5 pr-4 align-top">{c.render(r)}</td>
                ))}
                <td className="py-2.5 text-right whitespace-nowrap">
                  <DBtn variant="secondary" onClick={() => onEdit(r)} className="mr-1.5 !px-3 !py-1.5 text-xs">Edit</DBtn>
                  <DBtn variant="danger" onClick={() => onDelete(r)} className="!px-3 !py-1.5 text-xs">Delete</DBtn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState>No records match. Clear the search or add one.</EmptyState>}
      </div>
      <div className="mt-3 text-[11px] text-[#98a2b3]">{filtered.length} of {rows.length} records</div>
    </DCard>
  );
}

export function TagPill({ text }: { text: string }) {
  const tone = (() => {
    const t = text.toUpperCase();
    if (t === "CONVERTED" || t === "PAID" || t === "COMPLETED" || t === "ACTIVE") return "green" as const;
    if (t === "NOT INTERESTED" || t === "INACTIVE") return "red" as const;
    if (t === "APPOINTMENT" || t === "PENDING" || t === "UPCOMING") return "amber" as const;
    if (t === "PARTNER" || t === "BOTH") return "purple" as const;
    return "blue" as const;
  })();
  return <Pill tone={tone}>{text}</Pill>;
}
