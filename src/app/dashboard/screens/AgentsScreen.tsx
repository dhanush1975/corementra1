import { useMemo, useState } from "react";
import { branchOf, directsOf, initials, money, RANKS, saleWriting, shortDate } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { DBtn, DCard } from "../ui";
import type { Agent, Db, IncomeData } from "../types";

function personalBusiness(income: IncomeData, name: string) {
  return income.sales.reduce((n, s) => n + (s.agent === name ? Number(s.premium) || 0 : 0), 0);
}
function personalCommission(income: IncomeData, name: string) {
  return income.sales.reduce((n, s) => n + (s.agent === name ? saleWriting(s).writing : 0), 0);
}
function rankOf(totalCommission: number) {
  let r = RANKS[0];
  RANKS.forEach(rk => { if (totalCommission >= rk.min) r = rk; });
  return r.name;
}

export function AgentsScreen({ db, income, commit }: { db: Db; income: IncomeData; commit: (db: Db, msg?: string) => void }) {
  const [modal, setModal] = useState<Agent | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const columns: ColumnDef<Agent>[] = [
    { key: "name", label: "Agent", render: r => (
        <button onClick={() => setDetail(r.name)} className="font-medium text-[#0070f3] hover:underline text-left">{r.name}</button>
      ), sortValue: r => r.name },
    { key: "title", label: "Title", render: r => r.title },
    { key: "region", label: "Region", render: r => r.region },
    { key: "team", label: "Team size", render: r => branchOf(db.agents, r.name).length - 1, sortValue: r => branchOf(db.agents, r.name).length },
    { key: "personal", label: "Personal sales", render: r => money(personalBusiness(income, r.name)), sortValue: r => personalBusiness(income, r.name) },
    { key: "joined", label: "Joined", render: r => shortDate(r.joined), sortValue: r => r.joined },
    { key: "status", label: "Status", render: r => <TagPill text={r.status} /> },
  ];

  const save = (rec: Agent) => {
    const list = db.agents.slice();
    const i = list.findIndex(r => r.id === rec.id);
    if (i >= 0) list[i] = rec; else list.unshift(rec);
    setModal(null);
    commit({ ...db, agents: list }, (i >= 0 ? "Saved " : "Added ") + rec.name);
  };
  const del = (rec: Agent) => {
    if (!window.confirm("Remove this agent? People under them move up one level.")) return;
    const agents = db.agents.filter(a => a.id !== rec.id).map(a => (a.uplineId === rec.id ? { ...a, uplineId: rec.uplineId } : a));
    commit({ ...db, agents }, rec.name + " removed");
  };

  const detailAgent = detail ? db.agents.find(a => a.name === detail) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Team</div>
          <h2 className="text-2xl font-black mt-0.5">Agents</h2>
          <p className="text-sm text-[#667085] mt-1">Who works for whom.</p>
        </div>
        <DBtn onClick={() => setModal(blankRecord("agents"))}>+ Add agent</DBtn>
      </div>

      {detailAgent ? (
        <AgentDetail db={db} income={income} agent={detailAgent} onBack={() => setDetail(null)} onAddUnder={() => setModal({ ...blankRecord("agents"), uplineId: detailAgent.id })} />
      ) : (
        <RecordTable<Agent> rows={db.agents} columns={columns} onEdit={setModal} onDelete={del} searchFn={(r, q) => (r.name + r.title + r.region).toLowerCase().includes(q)} />
      )}

      {modal && <RecordModal entityKey="agents" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}
    </div>
  );
}

function AgentDetail({ db, income, agent, onBack, onAddUnder }: { db: Db; income: IncomeData; agent: Agent; onBack: () => void; onAddUnder: () => void }) {
  const branch = useMemo(() => branchOf(db.agents, agent.name), [db.agents, agent.name]);
  const personalSales = personalBusiness(income, agent.name);
  const personalComm = personalCommission(income, agent.name);
  const teamSales = branch.reduce((n, a) => n + personalBusiness(income, a), 0) - personalSales;
  const teamComm = branch.reduce((n, a) => n + personalCommission(income, a), 0) - personalComm;
  const directs = directsOf(db.agents, agent.name);

  return (
    <DCard className="p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={onBack} className="text-xs text-[#98a2b3] mb-2 hover:text-[#0070f3]">← All agents</button>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center text-sm font-bold shrink-0">{initials(agent.name)}</span>
            <div>
              <h3 className="text-xl font-bold">{agent.name}</h3>
              <div className="text-xs text-[#98a2b3]">{agent.title} · {agent.region} · joined {shortDate(agent.joined)}</div>
            </div>
          </div>
        </div>
        <DBtn variant="secondary" onClick={onAddUnder}>+ Add under {agent.name}</DBtn>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#f5f5f5]"><div className="text-xl font-black">{money(personalSales + teamSales)}</div><div className="text-[11px] text-[#98a2b3] mt-1">Total branch revenue</div></div>
        <div className="p-4 rounded-xl bg-[#f5f5f5]"><div className="text-xl font-black text-[#14683f]">{money(personalComm)}</div><div className="text-[11px] text-[#98a2b3] mt-1">Personal commission</div></div>
        <div className="p-4 rounded-xl bg-[#f5f5f5]"><div className="text-xl font-black text-[#8a5a1a]">{money(teamComm)}</div><div className="text-[11px] text-[#98a2b3] mt-1">Team commission</div></div>
        <div className="p-4 rounded-xl bg-[#f5f5f5]"><div className="text-xl font-black">{directs.length}</div><div className="text-[11px] text-[#98a2b3] mt-1">Direct reports · {branch.length - 1} total downline</div></div>
      </div>

      <div className="p-4 rounded-xl bg-[#f5f5f5]">
        <div className="text-xs font-semibold text-[#667085] mb-1">Rank</div>
        <div className="text-lg font-bold">{rankOf(personalComm + teamComm)}</div>
      </div>

      <div>
        <h4 className="text-sm font-bold mb-3">Direct team</h4>
        {directs.length === 0 ? (
          <p className="text-sm text-[#98a2b3]">No agents yet under {agent.name}.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {directs.map(name => {
              const a = db.agents.find(x => x.name === name)!;
              return (
                <button key={name} className="text-left p-3.5 rounded-xl border border-[#e5e5e5] hover:border-[#0070f3] transition-colors flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-[#f2f4f7] text-[#475467] flex items-center justify-center text-xs font-bold shrink-0">{initials(name)}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{name}</div>
                    <div className="text-[11px] text-[#98a2b3]">{a?.title}</div>
                  </div>
                  <span className="ml-auto text-xs font-bold text-[#0070f3] shrink-0">{money(personalCommission(income, name))}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DCard>
  );
}
