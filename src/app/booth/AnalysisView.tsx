import type { ReactNode } from "react";
import { ASKED, ASSETS, computeAnalysis, fmtMoney, QUESTIONS, type Analysis } from "./fna";

// Read-only summary of one booth visitor's analysis, for the dashboard.
export function AnalysisView({ analysis: a }: { analysis: Analysis }) {
  const c = computeAnalysis(a);
  const v = a.v;
  const m = (n: number) => fmtMoney(n);

  return (
    <div className="flex flex-col gap-5 text-sm">
      <Section title="Responsibility">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Liabilities" value={m(c.liabilities)} />
          <Stat label="Assets" value={m(c.assets)} />
          <Stat label="Responsibility" value={m(c.responsibility)} strong />
        </div>
        {c.surplus > 0 && <p className="text-xs text-[#667085] mt-2">Assets exceed liabilities by {m(c.surplus)}.</p>}
      </Section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Section title="Liabilities">
          <Line label="Debt" value={m(v.debt)} />
          <Line label="Income replacement" note={`${m(v.inc)} per year × ${v.years} years`} value={m(c.incomeRep)} />
          <Line label="Mortgage" value={m(v.mortgage)} />
          <Line label="Education" note={`${m(v.eduCost)} per year × ${v.eduYears} years × ${v.kids} ${v.kids === 1 ? "kid" : "kids"}`} value={m(c.edu)} />
        </Section>
        <Section title="Assets">
          {ASSETS.map(([k, label]) => <Line key={k} label={label} value={m(v[k])} />)}
        </Section>
      </div>

      <Section title="Income ratio">
        {c.people.map(p => (
          <Line key={p.name + p.share} label={`${p.name} · ${Math.round(p.share * 100)}%`} value={m(p.resp)} />
        ))}
      </Section>

      <Section title="Questions">
        {QUESTIONS.filter(q => ASKED.includes(q.key)).map((q, i) => {
          const ans = a.ans[q.key];
          return (
            <div key={q.key} className="flex items-start justify-between gap-3 py-2 border-b border-[#f4f5f7] last:border-0">
              <span className="text-[#475467]"><span className="text-[#98a2b3] mr-1.5">{String(i + 1).padStart(2, "0")}</span>{q.text}</span>
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${ans === "Y" ? "bg-[#e7f4ec] text-[#14683f]" : ans === "N" ? "bg-[#faeceb] text-[#a4372f]" : ans ? "bg-[#f1eefb] text-[#5341a6]" : "bg-[#f2f4f7] text-[#98a2b3]"}`}>
                {ans === "Y" ? "Yes" : ans === "N" ? "No" : ans ? `${ans} / 10` : "—"}
              </span>
            </div>
          );
        })}
        <Line label="Meeting booked" value={a.booked ? "Yes" : "No"} />
      </Section>

    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#98a2b3] mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${strong ? "bg-[#0a0a0a] text-white" : "bg-[#fafbfc] border border-[#eef0f3]"}`}>
      <div className={`text-[11px] font-semibold ${strong ? "text-white/70" : "text-[#98a2b3]"}`}>{label}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}

function Line({ label, note, value }: { label: string; note?: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[#f4f5f7] last:border-0">
      <div>
        <div className="text-[#475467]">{label}</div>
        {note && <div className="text-[11px] text-[#98a2b3]">{note}</div>}
      </div>
      <span className="font-semibold shrink-0">{value}</span>
    </div>
  );
}
