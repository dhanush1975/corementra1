import { Mail, Phone, User } from "lucide-react";
import { useState } from "react";
import { initials, money, shortDate } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { BoardCardHeader, BoardHint, BoardToggle, CardRow, KanbanBoard, MiniBadge, type BoardColumn } from "../Board";
import { DBtn } from "../ui";
import type { Client, ClientType, Db, IncomeData } from "../types";

const COLUMNS: BoardColumn<ClientType>[] = [
  { key: "Client", label: "Client", dot: "#3f7fe0" },
  { key: "Partner", label: "Partner", dot: "#8b5cf0" },
  { key: "Both", label: "Both", dot: "#e8a33d" },
];

const BADGE_TONE: Record<ClientType, "blue" | "purple" | "amber"> = { Client: "blue", Partner: "purple", Both: "amber" };

export function ClientsScreen({ db, income, commit }: { db: Db; income: IncomeData; commit: (db: Db, msg?: string) => void }) {
  const [view, setView] = useState<"board" | "table">("board");
  const [modal, setModal] = useState<Client | null>(null);
  const [typeFilter, setTypeFilter] = useState("All");

  const rows = typeFilter === "All" ? db.clients : db.clients.filter(c => c.type === typeFilter);

  const columns: ColumnDef<Client>[] = [
    { key: "name", label: "Name", render: r => <span className="font-medium">{r.name}</span>, sortValue: r => r.name },
    { key: "type", label: "Type", render: r => <TagPill text={r.type} /> },
    { key: "email", label: "Email", render: r => r.email },
    { key: "phone", label: "Phone", render: r => r.phone },
    { key: "agent", label: "Agent", render: r => r.agent },
    { key: "source", label: "Source", render: r => r.source },
    { key: "business", label: "Business", render: r => money(income.sales.filter(s => s.clientId === r.id).reduce((n, s) => n + (Number(s.premium) || 0), 0)) },
    { key: "since", label: "Since", render: r => shortDate(r.since), sortValue: r => r.since },
  ];

  const save = (rec: Client) => {
    const list = db.clients.slice();
    const i = list.findIndex(r => r.id === rec.id);
    if (i >= 0) list[i] = rec; else list.unshift(rec);
    setModal(null);
    commit({ ...db, clients: list }, (i >= 0 ? "Saved " : "Added ") + rec.name);
  };
  const del = (rec: Client) => {
    if (!window.confirm("Delete this record?")) return;
    commit({ ...db, clients: db.clients.filter(r => r.id !== rec.id) }, "Record deleted");
  };
  const moveType = (rec: Client, type: ClientType) => {
    commit({ ...db, clients: db.clients.map(c => (c.id === rec.id ? { ...c, type } : c)) }, rec.name + " → " + type);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Book of business</div>
          <h2 className="text-2xl font-black mt-0.5">Clients &amp; Partners</h2>
          <p className="text-sm text-[#667085] mt-1">Clients purchase products; partners are recruited associates.</p>
        </div>
        <DBtn onClick={() => setModal(blankRecord("clients"))}>+ New record</DBtn>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <BoardToggle view={view} onChange={setView} />
          <div className="inline-flex p-1 rounded-full bg-[#eceef1] w-max">
            {["All", "Client", "Partner", "Both"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${typeFilter === t ? "bg-white shadow-sm" : "text-[#667085]"}`}>{t}</button>
            ))}
          </div>
        </div>
        {view === "board" && <BoardHint />}
      </div>

      {view === "table" ? (
        <RecordTable<Client> rows={rows} columns={columns} onEdit={setModal} onDelete={del} searchFn={(r, q) => (r.name + r.email + r.agent).toLowerCase().includes(q)} />
      ) : (
        <KanbanBoard<Client, ClientType>
          columns={COLUMNS}
          rows={rows}
          getColumn={r => r.type}
          onMove={moveType}
          onAdd={type => setModal({ ...blankRecord("clients"), type })}
          onOpen={setModal}
          countNoun="RECORD"
          renderCard={(r, col) => (
            <>
              <BoardCardHeader
                avatarText={initials(r.name)}
                avatarSeed={r.id}
                dotColor={col.dot}
                title={r.name}
                badge={<MiniBadge text={r.type.toUpperCase()} tone={BADGE_TONE[r.type]} />}
                subtitle={"since " + shortDate(r.since)}
                onDelete={() => del(r)}
              />
              <CardRow icon={<Mail size={14} />}>{r.email}</CardRow>
              <CardRow icon={<Phone size={14} />}>{r.phone}</CardRow>
              <CardRow icon={<User size={14} />}>{r.agent}{r.source ? " · " + r.source : ""}</CardRow>
            </>
          )}
        />
      )}

      {modal && <RecordModal entityKey="clients" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}
    </div>
  );
}
