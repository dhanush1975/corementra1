import { download, toCsv } from "../data";
import { DBtn, DCard } from "../ui";
import type { Db, IncomeData } from "../types";

const SCHEMA = [
  "events(event_id pk, name, starts_at, address, time_frame, expense, status, registered, attended)",
  "prospects(prospect_id pk, event_id fk, agent_id, name, email, phone, source, financial_need, stage, last_contact, notes)",
  "follow_ups(follow_up_id pk, prospect_id fk, agent_id, subject, type, due_at, status, note)",
  "clients(client_id pk, prospect_id fk, name, email, phone, address, type[client|partner], agent_id, referral_source, since)",
  "sales(sale_id pk, client_id fk, product_id fk, premium, base_pct, contract_pct, agent_id, status[pending|paid])",
  "partner_income(partner_income_id pk, agent_id, partner, amount, note)",
  "feedback(feedback_id pk, client_id fk, rating_1_5, comment, submitted_at)",
];

export function DataScreen({ db, income, commit, resetSeed, resetEmpty }: { db: Db; income: IncomeData; commit: (db: Db, msg?: string) => void; resetSeed: () => void; resetEmpty: () => void }) {
  const counts = [
    { label: "Events", n: db.events.length },
    { label: "Prospects", n: db.prospects.length },
    { label: "Follow-Ups", n: db.followUps.length },
    { label: "Clients & Partners", n: db.clients.length },
    { label: "Sales", n: income.sales.length },
    { label: "Partner Income", n: income.partner.length },
    { label: "Feedback", n: db.feedback.length },
    { label: "Agents", n: db.agents.length },
  ];

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        commit(JSON.parse(String(fr.result)), "Backup restored");
      } catch {
        commit(db, "That file could not be read as JSON");
      }
    };
    fr.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Admin</div>
        <h2 className="text-2xl font-black mt-0.5">Data &amp; Backup</h2>
        <p className="text-sm text-[#667085] mt-1">Export, restore, reset — and the schema this data follows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DCard className="p-5">
          <h4 className="text-base font-bold mb-3">Record counts</h4>
          <div className="flex flex-col gap-2">
            {counts.map(c => (
              <div key={c.label} className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#fafbfc] text-sm">
                <span className="text-[#475467]">{c.label}</span>
                <span className="font-bold">{c.n}</span>
              </div>
            ))}
          </div>
        </DCard>

        <DCard className="p-5 flex flex-col gap-2.5">
          <h4 className="text-base font-bold">Backup &amp; restore</h4>
          <p className="text-xs text-[#667085] mb-1">Data lives in the cloud. Export regularly for backups.</p>
          <DBtn onClick={() => download("crm-backup.json", JSON.stringify(db, null, 2), "application/json")}>Download JSON backup</DBtn>
          <label className="h-10 rounded-full border border-[#e5e5e5] bg-white text-[#344054] text-[13px] font-semibold flex items-center justify-center cursor-pointer hover:bg-[#f5f5f5] transition-colors">
            Restore from JSON
            <input type="file" accept=".json" onChange={importJson} className="hidden" />
          </label>
          <DBtn
            variant="secondary"
            onClick={() => {
              (Object.keys(db) as (keyof Db)[]).forEach(k => {
                const rows = db[k] as any[];
                if (rows.length) download(k + ".csv", toCsv(rows, Object.keys(rows[0])), "text/csv");
              });
              commit(db, "CSV files downloaded");
            }}
          >
            Export every table as CSV
          </DBtn>
        </DCard>

        <DCard className="p-5 flex flex-col gap-2.5">
          <h4 className="text-base font-bold">Reset</h4>
          <p className="text-xs text-[#667085] mb-1">Reload the sample book, or start from an empty database.</p>
          <DBtn variant="secondary" onClick={resetSeed}>Reset to sample data</DBtn>
          <DBtn variant="danger" onClick={resetEmpty}>Clear all records</DBtn>
        </DCard>

        <DCard className="p-5">
          <h4 className="text-base font-bold mb-3">Schema</h4>
          <div className="flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed text-[#475467]">
            {SCHEMA.map(s => (
              <div key={s} className="px-2.5 py-2 rounded-lg bg-[#fafbfc] overflow-x-auto whitespace-nowrap">{s}</div>
            ))}
          </div>
        </DCard>
      </div>
    </div>
  );
}
