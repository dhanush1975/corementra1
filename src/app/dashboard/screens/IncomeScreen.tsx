import { useMemo, useState } from "react";
import { INC_PERIODS, money, saleWriting, shortDate, today, uid } from "../data";
import { DBtn, DCard, DSelect, EmptyState, Field, Modal, DInput, Pill } from "../ui";
import type { Db, IncomeData, Product, Sale, PartnerIncome } from "../types";

function inPeriod(dateStr: string, period: string) {
  if (period === "All time") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date(today() + "T00:00:00");
  if (period === "This month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const months = period === "Last 3 months" ? 3 : 12;
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return d >= start && d <= new Date(now.getFullYear(), now.getMonth() + 1, 0);
}

export function IncomeScreen({ db, products, income, setIncome }: { db: Db; products: Product[]; income: IncomeData; setIncome: (i: IncomeData) => void }) {
  const [period, setPeriod] = useState("Last 12 months");
  const [tab, setTab] = useState<"sales" | "partners">("sales");
  const [saleEditor, setSaleEditor] = useState<Sale | null>(null);
  const [partnerEditor, setPartnerEditor] = useState<PartnerIncome | null>(null);

  const sales = income.sales.filter(s => inPeriod(s.date, period)).sort((a, b) => b.date.localeCompare(a.date));
  const partners = income.partner.filter(p => inPeriod(p.date, period)).sort((a, b) => b.date.localeCompare(a.date));
  const totalWriting = sales.reduce((n, s) => n + saleWriting(s).writing, 0);
  const paidWriting = sales.filter(s => s.status === "Paid").reduce((n, s) => n + saleWriting(s).writing, 0);
  const partnerSum = partners.reduce((n, p) => n + p.amount, 0);
  const pending = sales.filter(s => s.status === "Pending").reduce((n, s) => n + saleWriting(s).writing, 0);

  const clientName = (id: string) => db.clients.find(c => c.id === id)?.name || "—";

  const saveSale = (rec: Sale) => {
    const exists = income.sales.some(s => s.id === rec.id);
    setIncome({ ...income, sales: exists ? income.sales.map(s => (s.id === rec.id ? rec : s)) : [rec, ...income.sales] });
    setSaleEditor(null);
  };
  const savePartner = (rec: PartnerIncome) => {
    const exists = income.partner.some(p => p.id === rec.id);
    setIncome({ ...income, partner: exists ? income.partner.map(p => (p.id === rec.id ? rec : p)) : [rec, ...income.partner] });
    setPartnerEditor(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Finance</div>
          <h2 className="text-2xl font-black mt-0.5">My Income</h2>
          <p className="text-sm text-[#667085] mt-1">Log what you sold and what partners paid you.</p>
        </div>
        <div className="flex items-center gap-2">
          <DSelect value={period} onChange={e => setPeriod(e.target.value)} className="w-auto">
            {INC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
          </DSelect>
          <DBtn variant="secondary" onClick={() => setPartnerEditor({ id: "", date: today(), agent: db.agents[0]?.name || "", partner: "", amount: 0, note: "" })}>+ Partner income</DBtn>
          <DBtn onClick={() => setSaleEditor({ id: "", date: today(), clientId: "", productId: "", productLabel: "", basePct: 0, premium: 0, agent: db.agents[0]?.name || "", contractPct: 30, status: "Pending" })}>+ Log sale</DBtn>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DCard className="p-4"><div className="text-2xl font-black">{money(paidWriting + partnerSum)}</div><div className="text-xs text-[#98a2b3] mt-1">Paid income</div></DCard>
        <DCard className="p-4"><div className="text-2xl font-black">{money(totalWriting)}</div><div className="text-xs text-[#98a2b3] mt-1">{sales.length} sales logged (paid + pending)</div></DCard>
        <DCard className="p-4"><div className="text-2xl font-black">{money(partnerSum)}</div><div className="text-xs text-[#98a2b3] mt-1">{partners.length} partner entries</div></DCard>
        <DCard className="p-4"><div className="text-2xl font-black">{money(pending)}</div><div className="text-xs text-[#98a2b3] mt-1">sales not paid yet</div></DCard>
      </div>

      <DCard className="p-5">
        <div className="flex gap-1 border-b border-[#eef0f3] mb-3">
          <button onClick={() => setTab("sales")} className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${tab === "sales" ? "text-[#0070f3] shadow-[inset_0_-2px_0_#0070f3]" : "text-[#475467]"}`}>Sales <span className="text-[11px] text-[#98a2b3] ml-1">{sales.length}</span></button>
          <button onClick={() => setTab("partners")} className={`px-3.5 py-2.5 text-sm font-medium transition-colors ${tab === "partners" ? "text-[#0070f3] shadow-[inset_0_-2px_0_#0070f3]" : "text-[#475467]"}`}>Partner income <span className="text-[11px] text-[#98a2b3] ml-1">{partners.length}</span></button>
        </div>
        {tab === "sales" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[12px] font-semibold text-[#475467] border-b border-[#eef0f3]">
                <th className="py-2.5">Date</th><th className="py-2.5">Client</th><th className="py-2.5">Product</th><th className="py-2.5">Premium</th><th className="py-2.5">Income</th><th className="py-2.5">Status</th><th />
              </tr></thead>
              <tbody>
                {sales.map(s => {
                  const { writing, base } = saleWriting(s);
                  return (
                    <tr key={s.id} className="border-b border-[#f4f5f7] last:border-0">
                      <td className="py-2.5 text-[#667085] whitespace-nowrap">{shortDate(s.date)}</td>
                      <td className="py-2.5 font-medium whitespace-nowrap">{clientName(s.clientId)}</td>
                      <td className="py-2.5 min-w-[180px]">{s.productLabel}</td>
                      <td className="py-2.5 whitespace-nowrap">{money(s.premium)}</td>
                      <td className="py-2.5 font-bold whitespace-nowrap">{money(writing)}<span className="block text-[11px] text-[#98a2b3] font-normal">on {money(base)} commissionable</span></td>
                      <td className="py-2.5 whitespace-nowrap">
                        <button onClick={() => setIncome({ ...income, sales: income.sales.map(x => (x.id === s.id ? { ...x, status: x.status === "Paid" ? "Pending" : "Paid" } : x)) })}>
                          <Pill tone={s.status === "Paid" ? "green" : "amber"}>{s.status}</Pill>
                        </button>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        <DBtn variant="secondary" onClick={() => setSaleEditor(s)} className="mr-1.5 !px-3 !py-1.5 text-xs">Edit</DBtn>
                        <DBtn variant="danger" onClick={() => setIncome({ ...income, sales: income.sales.filter(x => x.id !== s.id) })} className="!px-3 !py-1.5 text-xs">Delete</DBtn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sales.length === 0 && <EmptyState>No sales in this period. Use "+ Log sale" to add one.</EmptyState>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-[12px] font-semibold text-[#475467] border-b border-[#eef0f3]">
                <th className="py-2.5">Date</th><th className="py-2.5">From partner</th><th className="py-2.5">Amount</th><th className="py-2.5">Note</th><th />
              </tr></thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b border-[#f4f5f7] last:border-0">
                    <td className="py-2.5 text-[#667085] whitespace-nowrap">{shortDate(p.date)}</td>
                    <td className="py-2.5 font-medium whitespace-nowrap">{p.partner}</td>
                    <td className="py-2.5 font-bold text-[#2f8f68] whitespace-nowrap">{money(p.amount)}</td>
                    <td className="py-2.5 text-[#667085] min-w-[160px]">{p.note || "—"}</td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <DBtn variant="secondary" onClick={() => setPartnerEditor(p)} className="mr-1.5 !px-3 !py-1.5 text-xs">Edit</DBtn>
                      <DBtn variant="danger" onClick={() => setIncome({ ...income, partner: income.partner.filter(x => x.id !== p.id) })} className="!px-3 !py-1.5 text-xs">Delete</DBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {partners.length === 0 && <EmptyState>No partner income in this period.</EmptyState>}
          </div>
        )}
      </DCard>

      {saleEditor && (
        <Modal title={saleEditor.id ? "Edit sale" : "Log a sale"} onClose={() => setSaleEditor(null)}>
          <SaleForm rec={saleEditor} db={db} products={products} onSave={saveSale} onCancel={() => setSaleEditor(null)} />
        </Modal>
      )}
      {partnerEditor && (
        <Modal title={partnerEditor.id ? "Edit partner income" : "Add partner income"} onClose={() => setPartnerEditor(null)}>
          <PartnerForm rec={partnerEditor} db={db} onSave={savePartner} onCancel={() => setPartnerEditor(null)} />
        </Modal>
      )}
    </div>
  );
}

function SaleForm({ rec, db, products, onSave, onCancel }: { rec: Sale; db: Db; products: Product[]; onSave: (s: Sale) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Sale>(rec);
  const [error, setError] = useState("");
  const preview = useMemo(() => saleWriting(draft), [draft]);
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!draft.clientId) { setError("Pick a client first."); return; }
        if (!draft.productId) { setError("Pick a product first."); return; }
        if (!(Number(draft.premium) > 0)) { setError("Target premium must be greater than 0."); return; }
        onSave({ ...draft, id: draft.id || uid() });
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <Field label="Submit date"><DInput type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field>
      <Field label="Client">
        <DSelect value={draft.clientId} onChange={e => setDraft({ ...draft, clientId: e.target.value })}>
          <option value="">Choose client...</option>
          {db.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </DSelect>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Product">
          <DSelect value={draft.productId} onChange={e => { const p = products.find(x => x.id === e.target.value); setDraft({ ...draft, productId: e.target.value, productLabel: p ? p.provider + " · " + p.product : "", basePct: p ? p.base : draft.basePct }); }}>
            <option value="">Choose product...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.provider} · {p.product}</option>)}
          </DSelect>
        </Field>
      </div>
      <Field label="Target premium ($)"><DInput type="number" value={draft.premium} onChange={e => setDraft({ ...draft, premium: Number(e.target.value) })} /></Field>
      <Field label="Commissionable base %"><DInput type="number" step="0.0001" value={draft.basePct} onChange={e => setDraft({ ...draft, basePct: Number(e.target.value) })} /></Field>
      <Field label="My contract %"><DInput type="number" value={draft.contractPct} onChange={e => setDraft({ ...draft, contractPct: Number(e.target.value) })} /></Field>
      <Field label="Agent">
        <DSelect value={draft.agent} onChange={e => setDraft({ ...draft, agent: e.target.value })}>
          {db.agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </DSelect>
      </Field>
      <Field label="Status">
        <DSelect value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as "Pending" | "Paid" })}>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </DSelect>
      </Field>
      <div className="sm:col-span-2 p-3 rounded-xl bg-[#f5f7fa] text-sm text-[#344054]">Commissionable amount {money(preview.base)} · you earn {money(preview.writing)}</div>
      {error && <div className="sm:col-span-2 text-sm text-[#a4372f] -mt-2">{error}</div>}
      <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
        <DBtn variant="secondary" onClick={onCancel}>Cancel</DBtn>
        <DBtn type="submit">{draft.id ? "Save changes" : "Log sale"}</DBtn>
      </div>
    </form>
  );
}

function PartnerForm({ rec, db, onSave, onCancel }: { rec: PartnerIncome; db: Db; onSave: (p: PartnerIncome) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<PartnerIncome>(rec);
  return (
    <form onSubmit={e => { e.preventDefault(); if (!(Number(draft.amount) > 0)) return; onSave({ ...draft, id: draft.id || uid() }); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Date"><DInput type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></Field>
      <Field label="Agent">
        <DSelect value={draft.agent} onChange={e => setDraft({ ...draft, agent: e.target.value })}>
          {db.agents.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
        </DSelect>
      </Field>
      <Field label="From partner"><DInput value={draft.partner} onChange={e => setDraft({ ...draft, partner: e.target.value })} placeholder="Partner name" /></Field>
      <Field label="Amount earned ($)"><DInput type="number" value={draft.amount} onChange={e => setDraft({ ...draft, amount: Number(e.target.value) })} /></Field>
      <div className="sm:col-span-2">
        <Field label="Note (optional)"><DInput value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} placeholder="e.g. referral bonus" /></Field>
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
        <DBtn variant="secondary" onClick={onCancel}>Cancel</DBtn>
        <DBtn type="submit">{draft.id ? "Save changes" : "Add income"}</DBtn>
      </div>
    </form>
  );
}
