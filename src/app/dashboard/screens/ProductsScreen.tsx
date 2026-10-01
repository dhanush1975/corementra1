import { useMemo, useState } from "react";
import { pct4, PROD_CATS, today, usd2 } from "../data";
import { DBtn, DCard, DInput, DSelect, EmptyState, Field, Modal } from "../ui";
import type { Product } from "../types";

export function ProductsScreen({ products, setProducts }: { products: Product[]; setProducts: (p: Product[]) => void }) {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [contractPct, setContractPct] = useState("30.00");
  const [premium, setPremium] = useState("0");
  const [editing, setEditing] = useState<Product | null>(null);

  const inTab = tab === "All" ? products : products.filter(p => p.category === tab);
  const q = query.trim().toLowerCase();
  const rows = (q ? inTab.filter(p => (p.provider + " " + p.product).toLowerCase().includes(q)) : inTab).map(p => {
    const yours = (p.base * (Number(contractPct) || 0)) / 100;
    const cash = ((Number(premium) || 0) * yours) / 100;
    return { p, yours, cash };
  });

  const save = (rec: Product) => {
    const exists = products.some(p => p.id === rec.id);
    setProducts(exists ? products.map(p => (p.id === rec.id ? rec : p)) : [...products, rec]);
    setEditing(null);
  };
  const del = (rec: Product) => setProducts(products.filter(p => p.id !== rec.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Products</div>
          <h2 className="text-2xl font-black mt-0.5">Compensation Schedule</h2>
          <p className="text-sm text-[#667085] mt-1">Set a contract percentage and target premium to see your % and estimated cashflow.</p>
        </div>
        <DBtn onClick={() => setEditing({ id: "", category: tab !== "All" ? tab : "Annuity", provider: "", product: "", base: 0, advance: 100, country: "USA" })}>+ Add product</DBtn>
      </div>

      <div className="flex gap-1 border-b border-[#eef0f3] overflow-x-auto">
        {["All", ...PROD_CATS].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? "text-[#0070f3] shadow-[inset_0_-2px_0_#0070f3]" : "text-[#475467]"}`}>
            {t} <span className="text-[11px] text-[#98a2b3] ml-1">{t === "All" ? products.length : products.filter(p => p.category === t).length}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <DInput placeholder="Search provider or product..." value={query} onChange={e => setQuery(e.target.value)} className="max-w-[280px]" />
        <label className="flex items-center gap-2 text-sm font-semibold text-[#344054]">Contract %
          <DInput type="number" value={contractPct} onChange={e => setContractPct(e.target.value)} className="w-24" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-[#344054]">Target premium ($)
          <DInput type="number" value={premium} onChange={e => setPremium(e.target.value)} className="w-32" />
        </label>
      </div>

      <DCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#eef0f3] text-[13px] font-semibold text-[#344054]">
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Base %</th>
                <th className="py-3 px-4">Your %</th>
                <th className="py-3 px-4">Est. cashflow</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, yours, cash }) => (
                <tr key={p.id} className="border-b border-[#f4f5f7] last:border-0">
                  <td className="py-3 px-4 font-medium uppercase whitespace-nowrap">{p.provider}</td>
                  <td className="py-3 px-4 min-w-[240px]">{p.product}<span className="block text-[11px] text-[#98a2b3]">{p.category} · {p.country}</span></td>
                  <td className="py-3 px-4 whitespace-nowrap">{pct4(p.base)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-[#1d4573] font-semibold">{pct4(yours)}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-[#14683f] font-semibold">{usd2(cash)}</td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <DBtn variant="secondary" onClick={() => setEditing(p)} className="mr-1.5 !px-3 !py-1.5 text-xs">Edit</DBtn>
                    <DBtn variant="danger" onClick={() => del(p)} className="!px-3 !py-1.5 text-xs">Delete</DBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState>No products match. Clear a filter or add a product.</EmptyState>}
        </div>
      </DCard>
      <p className="text-[11px] text-[#98a2b3]">Your % = base % × contract %. Estimated cashflow = target premium × your %.</p>

      {editing && (
        <Modal title={editing.id ? "Edit product" : "Add product"} onClose={() => setEditing(null)}>
          <ProductForm rec={editing} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}

function ProductForm({ rec, onSave, onCancel }: { rec: Product; onSave: (p: Product) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Product>(rec);
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!draft.provider.trim() || !draft.product.trim()) return;
        onSave({ ...draft, id: draft.id || "p" + today() + Math.random().toString(36).slice(2, 6) });
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <Field label="Category">
        <DSelect value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>
          {PROD_CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </DSelect>
      </Field>
      <Field label="Provider">
        <DInput value={draft.provider} onChange={e => setDraft({ ...draft, provider: e.target.value })} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Product">
          <DInput value={draft.product} onChange={e => setDraft({ ...draft, product: e.target.value })} />
        </Field>
      </div>
      <Field label="Commissionable base %">
        <DInput type="number" step="0.0001" value={draft.base} onChange={e => setDraft({ ...draft, base: Number(e.target.value) })} />
      </Field>
      <Field label="Issue advance %">
        <DInput type="number" step="0.01" value={draft.advance} onChange={e => setDraft({ ...draft, advance: Number(e.target.value) })} />
      </Field>
      <Field label="Country">
        <DInput value={draft.country} onChange={e => setDraft({ ...draft, country: e.target.value })} />
      </Field>
      <div className="sm:col-span-2 flex justify-end gap-2 mt-1">
        <DBtn variant="secondary" onClick={onCancel}>Cancel</DBtn>
        <DBtn type="submit">{draft.id ? "Save changes" : "Add product"}</DBtn>
      </div>
    </form>
  );
}
