import { dayDiff, money, pct, saleWriting, shortDate } from "../data";
import { DBtn, DCard, KpiCard } from "../ui";
import type { Db, IncomeData } from "../types";

export function DashboardScreen({ db, income, goFollowUps }: { db: Db; income: IncomeData; goFollowUps: () => void }) {
  const openFu = db.followUps.filter(f => f.status === "Open");
  const conv = db.prospects.filter(p => p.stage === "CONVERTED");
  const totalCommission = income.sales.reduce((n, s) => n + saleWriting(s).writing, 0);
  const overdueCount = openFu.filter(f => dayDiff(f.dueDate) < 0).length;

  const funnelBase = db.events.reduce((n, e) => n + (Number(e.attended) || 0), 0) || db.prospects.length;
  const contactedPlus = db.prospects.filter(p => ["CONTACTED", "APPOINTMENT", "IN PROCESS", "CONVERTED"].includes(p.stage)).length;
  const apptPlus = db.prospects.filter(p => ["APPOINTMENT", "IN PROCESS", "CONVERTED"].includes(p.stage)).length;
  const funnel = [
    { label: "Attendees", count: funnelBase, rate: "—" },
    { label: "Prospects", count: db.prospects.length, rate: pct(db.prospects.length, funnelBase) },
    { label: "Contacted+", count: contactedPlus, rate: pct(contactedPlus, db.prospects.length) },
    { label: "Appointments", count: apptPlus, rate: pct(apptPlus, db.prospects.length) },
    { label: "Converted", count: conv.length, rate: pct(conv.length, db.prospects.length) },
  ];
  const maxFunnel = Math.max(...funnel.map(f => f.count), 1);

  const due = openFu
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .filter(f => dayDiff(f.dueDate) <= 2)
    .slice(0, 6);

  const eventPerf = db.events.map(e => {
    const pl = db.prospects.filter(p => p.eventId === e.id);
    const cn = pl.filter(p => p.stage === "CONVERTED");
    const com = income.sales
      .filter(s => { const c = db.clients.find(x => x.id === s.clientId); return c && cn.some(q => q.name === c.name); })
      .reduce((n, s) => n + saleWriting(s).writing, 0);
    return { name: e.name, attended: e.attended || 0, prospects: pl.length, clients: cn.length, commission: money(com) };
  });

  const agentRaw = Array.from(new Set(db.agents.map(a => a.name))).map(a => {
    const ss = income.sales.filter(s => s.agent === a);
    return { name: a, prospects: db.prospects.filter(p => p.agent === a).length, clients: db.clients.filter(c => c.agent === a).length, business: ss.reduce((n, s) => n + (Number(s.premium) || 0), 0), commission: ss.reduce((n, s) => n + saleWriting(s).writing, 0) };
  });
  const maxBv = Math.max(...agentRaw.map(a => a.business), 1);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Overview</div>
        <h1 className="text-[28px] font-black mt-0.5">Good day — here is the business</h1>
        <p className="text-sm text-[#667085] mt-1">Every number below is computed from the records in this workspace.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Events" value={String(db.events.length)} note={db.events.filter(e => e.status === "Completed").length + " completed"} />
        <KpiCard label="Prospects" value={String(db.prospects.length)} note={db.prospects.filter(p => p.stage === "NEW").length + " not yet contacted"} tone="blue" />
        <KpiCard label="Follow-ups open" value={String(openFu.length)} note={overdueCount + " overdue"} tone={overdueCount ? "red" : "green"} />
        <KpiCard label="Conversion" value={pct(conv.length, db.prospects.length)} note="prospect → converted" tone="green" />
        <KpiCard label="Clients" value={String(db.clients.filter(c => c.type === "Client" || c.type === "Both").length)} note="purchased a product" />
        <KpiCard label="Partners" value={String(db.clients.filter(c => c.type === "Partner" || c.type === "Both").length)} note="recruited associates" />
        <KpiCard label="Commission" value={money(totalCommission)} note={"across " + income.sales.length + " sales"} tone="blue" />
        <KpiCard label="Agents" value={String(db.agents.length)} note="in the organization" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <DCard className="p-5">
          <h4 className="text-base font-bold mb-4">Prospect funnel</h4>
          <div className="flex flex-col gap-3">
            {funnel.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-[13px] text-[#344054]">{f.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#f0f2f5] overflow-hidden">
                  <div className="h-full rounded-full bg-[#0070f3]" style={{ width: Math.max(2, (f.count / maxFunnel) * 100) + "%" }} />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-bold">{f.count}</span>
                <span className="w-11 shrink-0 text-right text-xs text-[#667085]">{f.rate}</span>
              </div>
            ))}
          </div>
        </DCard>

        <DCard className="p-5 flex flex-col">
          <h4 className="text-base font-bold mb-3">Due &amp; overdue</h4>
          <div className="flex flex-col gap-2 flex-1">
            {due.length === 0 && <p className="text-sm text-[#98a2b3]">Nothing due. Add a follow-up to see it here.</p>}
            {due.map(f => {
              const d = dayDiff(f.dueDate);
              const label = d < 0 ? Math.abs(d) + "d late" : d === 0 ? "today" : "in " + d + "d";
              return (
                <div key={f.id} className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg bg-[#fafbfc]">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${d < 0 ? "bg-[#faeceb] text-[#a4372f]" : d === 0 ? "bg-[#eaf1f9] text-[#141a20]" : "bg-[#f2f4f7] text-[#475467]"}`}>{label}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[#344054] truncate">{f.subject} — {f.type}</div>
                    {f.note && <div className="text-xs text-[#98a2b3] truncate">{f.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          <DBtn onClick={goFollowUps} className="w-full justify-center mt-4">Open follow-ups</DBtn>
        </DCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DCard className="p-5 min-w-0">
          <h4 className="text-base font-bold mb-3">Event performance</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-[#98a2b3] border-b border-[#eef0f3]">
                  <th className="text-left font-medium py-2">Event</th>
                  <th className="text-right font-medium py-2">Attended</th>
                  <th className="text-right font-medium py-2">Prospects</th>
                  <th className="text-right font-medium py-2">Clients</th>
                  <th className="text-right font-medium py-2">Commission</th>
                </tr>
              </thead>
              <tbody>
                {eventPerf.map(e => (
                  <tr key={e.name} className="border-b border-[#f4f5f7] last:border-0">
                    <td className="py-2.5 font-medium truncate max-w-[160px]">{e.name}</td>
                    <td className="py-2.5 text-right">{e.attended}</td>
                    <td className="py-2.5 text-right">{e.prospects}</td>
                    <td className="py-2.5 text-right">{e.clients}</td>
                    <td className="py-2.5 text-right font-semibold">{e.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DCard>

        <DCard className="p-5 min-w-0">
          <h4 className="text-base font-bold mb-3">Agent performance</h4>
          <div className="flex flex-col gap-3">
            {agentRaw.map(a => (
              <div key={a.name} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-[13px]">
                    <span className="font-semibold truncate">{a.name}</span>
                    <span className="text-[#344054] shrink-0">{money(a.business)} · <strong>{money(a.commission)}</strong></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#f0f2f5] mt-1.5 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0070f3]" style={{ width: Math.max(3, (a.business / maxBv) * 100) + "%" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DCard>
      </div>
    </div>
  );
}
