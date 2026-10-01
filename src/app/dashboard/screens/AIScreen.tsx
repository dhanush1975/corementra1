import { useState } from "react";
import { dayDiff, money, pct, saleWriting, shortDate, STAGES } from "../data";
import { DBtn, DCard, DInput } from "../ui";
import type { Db, IncomeData } from "../types";

type ChatMsg = { who: "You" | "Assistant"; text: string; fn?: string };

const PROMPTS = ["Show the pipeline by stage", "Which follow-ups are overdue?", "Total commission by agent", "Which event converted best?", "Compare referral sources"];

function answer(db: Db, income: IncomeData, text: string): { reply: string; fn?: string } {
  const t = text.toLowerCase();
  const open = db.followUps.filter(f => f.status === "Open");
  const conv = db.prospects.filter(p => p.stage === "CONVERTED");
  const stageHit = STAGES.find(s => t.includes(s.toLowerCase()));

  if (t.includes("overdue")) {
    const od = open.filter(f => dayDiff(f.dueDate) < 0);
    return {
      reply: od.length + " overdue follow-up" + (od.length === 1 ? "" : "s") + "." + (od.length ? "\n" + od.map(f => "· " + f.subject + " — " + f.type + ", " + Math.abs(dayDiff(f.dueDate)) + "d late (" + f.agent + ")").join("\n") : ""),
      fn: "list_follow_ups(status=open, due_at<today)",
    };
  }
  if (t.includes("today") || (t.includes("follow") && t.includes("due"))) {
    const td = open.filter(f => dayDiff(f.dueDate) === 0);
    return { reply: td.length + " follow-up" + (td.length === 1 ? "" : "s") + " due today." + (td.length ? "\n" + td.map(f => "· " + f.subject + " — " + f.type + " (" + f.agent + ")").join("\n") : ""), fn: "list_follow_ups(status=open, due_at=today)" };
  }
  if (t.includes("commission") || t.includes("paid") || t.includes("earn")) {
    const total = income.sales.reduce((n, s) => n + saleWriting(s).writing, 0);
    const byAgent: Record<string, number> = {};
    income.sales.forEach(s => { const a = s.agent || "Unassigned"; byAgent[a] = (byAgent[a] || 0) + saleWriting(s).writing; });
    return {
      reply: "Total commission is " + money(total) + " across " + income.sales.length + " sales.\n" + Object.keys(byAgent).sort((a, b) => byAgent[b] - byAgent[a]).map(a => "· " + a + " — " + money(byAgent[a])).join("\n"),
      fn: "sum_commissions(group_by=agent)",
    };
  }
  if (t.includes("business value") || t.includes("revenue")) {
    return { reply: "Business value written is " + money(income.sales.reduce((n, s) => n + (Number(s.premium) || 0), 0)) + " from " + income.sales.length + " sales.", fn: "sum_business_value()" };
  }
  if (t.includes("partner") || t.includes("recruit")) {
    const ps = db.clients.filter(c => c.type === "Partner");
    return { reply: ps.length + " partner" + (ps.length === 1 ? "" : "s") + " on the books." + (ps.length ? "\n" + ps.map(p => "· " + p.name + " — " + p.agent + ", since " + shortDate(p.since)).join("\n") : ""), fn: "list_clients(type=partner)" };
  }
  if (t.includes("rating") || t.includes("feedback") || t.includes("satisf")) {
    const r = db.feedback.map(f => Number(f.rating) || 0);
    const avg = r.length ? Math.round((r.reduce((a, b) => a + b, 0) / r.length) * 10) / 10 : 0;
    return { reply: r.length ? "Average rating is " + avg + " from " + r.length + " responses — " + pct(r.filter(x => x === 5).length, r.length) + " five-star." : "No feedback recorded yet.", fn: "feedback_summary()" };
  }
  if (t.includes("event") && (t.includes("best") || t.includes("convert") || t.includes("perform"))) {
    const scored = db.events.map(e => {
      const pl = db.prospects.filter(p => p.eventId === e.id);
      const cn = pl.filter(p => p.stage === "CONVERTED").length;
      return { name: e.name, pros: pl.length, conv: cn, rate: pl.length ? cn / pl.length : 0 };
    }).sort((a, b) => b.rate - a.rate);
    return {
      reply: scored.length ? "Best converting event: " + scored[0].name + " — " + scored[0].pros + " prospects, " + scored[0].conv + " converted (" + pct(scored[0].conv, scored[0].pros) + ").\n" + scored.slice(1, 4).map(s => "· " + s.name + " — " + pct(s.conv, s.pros)).join("\n") : "No events recorded.",
      fn: "event_performance(order_by=conversion)",
    };
  }
  if (stageHit || t.includes("pipeline") || t.includes("prospect")) {
    if (stageHit && !t.includes("pipeline")) {
      const list = db.prospects.filter(p => p.stage === stageHit);
      return { reply: list.length + " prospect" + (list.length === 1 ? "" : "s") + " in " + stageHit + "." + (list.length ? "\n" + list.map(p => "· " + p.name + " — " + p.need + " (" + p.agent + ")").join("\n") : ""), fn: "list_prospects(stage=" + stageHit.toLowerCase().replace(/ /g, "_") + ")" };
    }
    return { reply: "Pipeline: " + STAGES.map(s => s + " " + db.prospects.filter(p => p.stage === s).length).join(" · ") + "\nConverted " + pct(conv.length, db.prospects.length) + " of " + db.prospects.length + " prospects.", fn: "pipeline_summary()" };
  }
  if (t.includes("client")) {
    return { reply: db.clients.filter(c => c.type === "Client").length + " clients and " + db.clients.filter(c => c.type === "Partner").length + " partners. Average business value per record: " + money(income.sales.reduce((n, s) => n + (Number(s.premium) || 0), 0) / (db.clients.length || 1)) + ".", fn: "list_clients()" };
  }
  if (t.includes("source") || t.includes("referral")) {
    const by: Record<string, { n: number; c: number }> = {};
    db.prospects.forEach(p => { by[p.source] = by[p.source] || { n: 0, c: 0 }; by[p.source].n++; if (p.stage === "CONVERTED") by[p.source].c++; });
    return { reply: Object.keys(by).sort((a, b) => by[b].n - by[a].n).map(s => "· " + s + " — " + by[s].n + " prospects, " + pct(by[s].c, by[s].n) + " converted").join("\n") || "No prospects recorded.", fn: "source_performance()" };
  }
  return { reply: "I can answer on: pipeline by stage, follow-ups due today or overdue, commission and business value totals, event conversion, referral sources, clients and partners, and feedback ratings." };
}

export function AIScreen({ db, income }: { db: Db; income: IncomeData }) {
  const [chat, setChat] = useState<ChatMsg[]>([{ who: "Assistant", text: "Ask me anything about the records in this workspace — pipeline by stage, overdue follow-ups, commission totals, event conversion, referral sources, feedback averages." }]);
  const [draft, setDraft] = useState("");

  const ask = (text: string) => {
    const { reply, fn } = answer(db, income, text);
    setChat(c => [...c, { who: "You", text }, { who: "Assistant", text: reply, fn }]);
    setDraft("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 items-start">
      <DCard className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h4 className="text-base font-bold flex-1">Assistant</h4>
          <span className="text-[11px] text-[#667085] bg-[#f2f4f7] rounded-full px-2.5 py-1">Queries your local records</span>
        </div>
        <div className="flex flex-col gap-3 min-h-[260px]">
          {chat.map((m, i) => (
            <div key={i} className={`flex flex-col gap-1 ${m.who === "You" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line rounded-2xl ${m.who === "You" ? "bg-[#0a0a0a] text-white rounded-br-sm" : "bg-[#fafbfc] border border-[#eef0f3] rounded-bl-sm"}`}>{m.text}</div>
              {m.fn && <span className="text-[11px] text-[#98a2b3] font-mono">{m.fn}</span>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {PROMPTS.map(p => (
            <button key={p} onClick={() => ask(p)} className="text-xs border border-[#e5e5e5] rounded-full px-3 py-1.5 text-[#344054] hover:bg-[#f5f5f5] transition-colors">{p}</button>
          ))}
        </div>
        <form onSubmit={e => { e.preventDefault(); if (draft.trim()) ask(draft.trim()); }} className="flex gap-2">
          <DInput placeholder="Ask about prospects, events, follow-ups, commissions..." value={draft} onChange={e => setDraft(e.target.value)} />
          <DBtn type="submit">Send</DBtn>
        </form>
      </DCard>
      <div className="flex flex-col gap-3">
        <DCard className="p-4">
          <h5 className="text-xs uppercase tracking-wider text-[#98a2b3] mb-2">Approved functions</h5>
          <div className="flex flex-col gap-1.5 font-mono text-[11px] text-[#475467]">
            {["pipeline_summary()", "list_prospects(stage)", "list_follow_ups(status, due_at)", "sum_commissions(group_by)", "sum_business_value()", "event_performance(order_by)", "source_performance()", "list_clients(type)", "feedback_summary()"].map(f => (
              <div key={f} className="px-2.5 py-1.5 rounded-lg bg-[#fafbfc]">{f}</div>
            ))}
          </div>
        </DCard>
        <DCard className="p-4">
          <h5 className="text-xs uppercase tracking-wider text-[#98a2b3] mb-2">Guardrails</h5>
          <div className="flex flex-col gap-2 text-sm text-[#344054]">
            {["Read-only queries — no arbitrary writes", "No raw SQL from the model", "Sensitive actions require confirmation", "Role-based permissions apply", "Every important action is logged"].map(g => (
              <div key={g} className="flex gap-2 items-start"><span className="w-1.5 h-1.5 rounded-full bg-[#0070f3] mt-1.5 shrink-0" />{g}</div>
            ))}
          </div>
        </DCard>
      </div>
    </div>
  );
}
