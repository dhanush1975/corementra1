import { useState, type ReactNode } from "react";

const AVATAR_PALETTE = [
  { bg: "#eaf1f9", fg: "#1c3a5e" },
  { bg: "#f1eefb", fg: "#4a3b8a" },
  { bg: "#fdf3e7", fg: "#8a5a1a" },
  { bg: "#e7f4ec", fg: "#14683f" },
];

export function avatarTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export function BoardToggle({ view, onChange }: { view: "board" | "table"; onChange: (v: "board" | "table") => void }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-[#eceef1] w-max shrink-0">
      {(["board", "table"] as const).map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-4 py-1.5 rounded-full text-[13px] font-semibold capitalize transition-colors ${view === v ? "bg-white shadow-sm" : "text-[#667085]"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export function BoardHint() {
  return <span className="text-[13px] text-[#98a2b3] whitespace-nowrap">Drag a card between columns · click to open it</span>;
}

export type BoardColumn<V extends string> = { key: V; label: string; dot: string };

export function KanbanBoard<T extends { id: string }, V extends string>({
  columns,
  rows,
  getColumn,
  onMove,
  onAdd,
  onOpen,
  renderCard,
  countNoun = "record",
}: {
  columns: BoardColumn<V>[];
  rows: T[];
  getColumn: (row: T) => V;
  onMove: (row: T, col: V) => void;
  onAdd?: (col: V) => void;
  onOpen: (row: T) => void;
  renderCard: (row: T, col: BoardColumn<V>) => ReactNode;
  countNoun?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<V | null>(null);

  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-4 px-1 items-start">
        {columns.map(col => {
          const cards = rows.filter(r => getColumn(r) === col.key);
          const isHot = dropCol === col.key;
          return (
            <div
              key={col.key}
              className={`flex flex-col gap-2.5 p-2 rounded-2xl transition-colors w-[300px] shrink-0 ${isHot ? "bg-[#f2f6fb]" : ""}`}
              onDragOver={e => { e.preventDefault(); setDropCol(col.key); }}
              onDragLeave={() => setDropCol(c => (c === col.key ? null : c))}
              onDrop={e => {
                e.preventDefault();
                setDropCol(null);
                const rec = rows.find(r => r.id === dragId);
                setDragId(null);
                if (rec && getColumn(rec) !== col.key) onMove(rec, col.key);
              }}
            >
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.dot }} />
                <span className="text-[13px] font-bold">{col.label}</span>
                <span className="text-[10px] font-semibold text-[#98a2b3] ml-auto">
                  {cards.length} {countNoun}{cards.length === 1 ? "" : "S"}
                </span>
                {onAdd && (
                  <button
                    onClick={() => onAdd(col.key)}
                    className="w-6 h-6 rounded-full bg-white border border-[#e5e5e5] text-[#667085] flex items-center justify-center text-xs hover:bg-[#f5f5f5] transition-colors shrink-0"
                  >
                    +
                  </button>
                )}
              </div>
              {cards.map(r => {
                const dragging = dragId === r.id;
                return (
                  <div
                    key={r.id}
                    draggable
                    onDragStart={() => setDragId(r.id)}
                    onDragEnd={() => setDragId(null)}
                    onClick={() => onOpen(r)}
                    className="bg-white border border-[#e5e5e5] rounded-2xl p-3.5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-2"
                    style={{ opacity: dragging ? 0.4 : 1 }}
                  >
                    {renderCard(r, col)}
                  </div>
                );
              })}
              {cards.length === 0 && <div className="text-xs text-[#c1c7d0] px-2 py-4 text-center">No records here yet</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BoardCardHeader({
  avatarText,
  avatarSeed,
  dotColor,
  title,
  subtitle,
  badge,
  onDelete,
}: {
  avatarText: string;
  avatarSeed: string;
  dotColor: string;
  title: string;
  subtitle: string;
  badge?: ReactNode;
  onDelete: () => void;
}) {
  const tone = avatarTone(avatarSeed);
  return (
    <div className="flex items-start gap-2.5">
      <span className="relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: tone.bg, color: tone.fg }}>
        {avatarText}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: dotColor }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-bold leading-snug flex items-center gap-1.5 flex-wrap">{title}{badge}</div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="w-6 h-6 rounded-full bg-[#fdf0ee] text-[#c1463a] flex items-center justify-center text-[11px] shrink-0 hover:bg-[#f9ddd8] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="text-[11px] text-[#98a2b3] mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

export function CardRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[#475467] truncate">
      <span className="text-[#98a2b3] shrink-0 flex items-center">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

export function CardPillButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="self-start inline-flex items-center text-[12px] font-semibold text-[#1c3a5e] bg-[#eaf1f9] px-3 py-1.5 rounded-full hover:bg-[#dce9f7] transition-colors"
    >
      {children}
    </button>
  );
}

export function MiniBadge({ text, tone = "blue" }: { text: string; tone?: "blue" | "purple" | "amber" }) {
  const tones: Record<string, string> = {
    blue: "bg-[#eaf1f9] text-[#1c3a5e]",
    purple: "bg-[#f1eefb] text-[#4a3b8a]",
    amber: "bg-[#fdf3e7] text-[#8a5a1a]",
  };
  return <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${tones[tone]}`}>{text}</span>;
}
