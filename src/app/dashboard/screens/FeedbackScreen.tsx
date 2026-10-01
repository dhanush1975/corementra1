import { useState } from "react";
import { shortDate } from "../data";
import { blankRecord } from "../forms";
import { RecordModal } from "../RecordModal";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { DBtn, DCard } from "../ui";
import type { Db, Feedback } from "../types";

export function FeedbackScreen({ db, commit }: { db: Db; commit: (db: Db, msg?: string) => void }) {
  const [modal, setModal] = useState<Feedback | null>(null);
  const clientName = (id: string) => db.clients.find(c => c.id === id)?.name || "—";

  const ratings = db.feedback.map(f => Number(f.rating) || 0);
  const avg = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;
  const fiveStar = ratings.filter(r => r === 5).length;

  const columns: ColumnDef<Feedback>[] = [
    { key: "client", label: "Client", render: r => <span className="font-medium">{clientName(r.clientId)}</span>, sortValue: r => clientName(r.clientId) },
    { key: "rating", label: "Rating", render: r => <TagPill text={r.rating + " ★"} /> },
    { key: "comment", label: "Comment", render: r => <span className="text-[#667085]">{r.comment}</span> },
    { key: "date", label: "Date", render: r => shortDate(r.date), sortValue: r => r.date },
  ];

  const save = (rec: Feedback) => {
    const list = db.feedback.slice();
    const i = list.findIndex(r => r.id === rec.id);
    if (i >= 0) list[i] = rec; else list.unshift(rec);
    setModal(null);
    commit({ ...db, feedback: list }, "Saved feedback");
  };
  const del = (rec: Feedback) => {
    if (!window.confirm("Delete this feedback?")) return;
    commit({ ...db, feedback: db.feedback.filter(r => r.id !== rec.id) }, "Deleted");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Experience</div>
          <h2 className="text-2xl font-black mt-0.5">Feedback &amp; Referral Analytics</h2>
          <p className="text-sm text-[#667085] mt-1">Experience ratings tied to the client record.</p>
        </div>
        <DBtn onClick={() => setModal(blankRecord("feedback"))}>+ New response</DBtn>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <DCard className="p-4">
          <div className="text-4xl font-black">{avg || "—"}</div>
          <div className="text-xs text-[#98a2b3] mt-1">Average rating</div>
        </DCard>
        <DCard className="p-4">
          <div className="text-4xl font-black">{ratings.length}</div>
          <div className="text-xs text-[#98a2b3] mt-1">Responses</div>
        </DCard>
        <DCard className="p-4">
          <div className="text-4xl font-black">{ratings.length ? Math.round((fiveStar / ratings.length) * 100) : 0}%</div>
          <div className="text-xs text-[#98a2b3] mt-1">Five-star</div>
        </DCard>
      </div>
      <RecordTable<Feedback> rows={db.feedback} columns={columns} onEdit={setModal} onDelete={del} searchFn={(r, q) => (clientName(r.clientId) + r.comment).toLowerCase().includes(q)} />
      {modal && <RecordModal entityKey="feedback" record={modal} db={db} agents={db.agents} onSave={save} onDelete={() => del(modal)} onClose={() => setModal(null)} />}
    </div>
  );
}
