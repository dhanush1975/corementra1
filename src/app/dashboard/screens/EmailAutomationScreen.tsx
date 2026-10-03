import { useEffect, useRef, useState } from "react";
import { getUrl, remove, uploadData } from "aws-amplify/storage";
import { client } from "../client";
import { uid } from "../data";
import { DBtn, DCard, DInput, DTextarea, Field, Pill } from "../ui";

type Occasion = "Birthday" | "Anniversary";

const OCCASIONS: { key: Occasion; title: string; blurb: string; hint: string }[] = [
  { key: "Birthday", title: "Birthday email", blurb: "Sent automatically on a client or prospect's birthday.", hint: "Use {{name}} anywhere in the subject or message." },
  { key: "Anniversary", title: "Anniversary email", blurb: "Sent automatically each year on a client's \"client since\" date.", hint: "Use {{name}} and {{years}} (e.g. \"3\") anywhere in the subject or message." },
];

type Row = { id?: string; occasion: Occasion; subject: string; body: string; flyerKey: string; active: boolean };

function TemplateCard({ def, row, onChange, onSave, saving }: {
  def: typeof OCCASIONS[number];
  row: Row;
  onChange: (next: Row) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [flyerUrl, setFlyerUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!row.flyerKey) { setFlyerUrl(""); return; }
    getUrl({ path: row.flyerKey }).then(r => { if (!cancelled) setFlyerUrl(r.url.toString()); }).catch(() => setFlyerUrl(""));
    return () => { cancelled = true; };
  }, [row.flyerKey]);

  const pickFile = () => fileRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `flyers/${row.occasion.toLowerCase()}-${uid()}-${file.name}`;
      await uploadData({ path, data: file, options: { contentType: file.type } }).result;
      onChange({ ...row, flyerKey: path });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  const removeFlyer = async () => {
    if (row.flyerKey) await remove({ path: row.flyerKey }).catch(() => {});
    onChange({ ...row, flyerKey: "" });
  };

  return (
    <DCard className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold">{def.title}</h4>
          <p className="text-xs text-[#667085] mt-0.5">{def.blurb}</p>
        </div>
        <button
          onClick={() => onChange({ ...row, active: !row.active })}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${row.active ? "bg-[#e7f4ec] text-[#14683f]" : "bg-[#f2f4f7] text-[#667085]"}`}
        >
          {row.active ? "Active" : "Inactive"}
        </button>
      </div>

      <Field label="Subject">
        <DInput value={row.subject} onChange={e => onChange({ ...row, subject: e.target.value })} placeholder={`Happy Birthday, {{name}}!`} />
      </Field>
      <Field label="Message">
        <DTextarea rows={6} value={row.body} onChange={e => onChange({ ...row, body: e.target.value })} placeholder="Paste or write the message..." />
      </Field>
      <p className="text-[11px] text-[#98a2b3] -mt-2">{def.hint}</p>

      <Field label="Flyer (optional)">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        {flyerUrl ? (
          <div className="flex items-center gap-3">
            <img src={flyerUrl} alt="Flyer" className="w-20 h-20 object-cover rounded-xl border border-[#e5e5e5]" />
            <div className="flex flex-col gap-1.5">
              <DBtn variant="secondary" onClick={pickFile} disabled={uploading}>Replace</DBtn>
              <DBtn variant="danger" onClick={removeFlyer}>Remove</DBtn>
            </div>
          </div>
        ) : (
          <DBtn variant="secondary" onClick={pickFile} disabled={uploading}>{uploading ? "Uploading..." : "Upload an image"}</DBtn>
        )}
      </Field>

      <DBtn onClick={onSave} disabled={saving} className="self-start">{saving ? "Saving..." : "Save template"}</DBtn>
    </DCard>
  );
}

export function EmailAutomationScreen() {
  const [rows, setRows] = useState<Record<Occasion, Row>>({
    Birthday: { occasion: "Birthday", subject: "", body: "", flyerKey: "", active: false },
    Anniversary: { occasion: "Anniversary", subject: "", body: "", flyerKey: "", active: false },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Occasion | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    client.models.EmailTemplate.list().then(({ data }) => {
      setRows(prev => {
        const next = { ...prev };
        data.forEach(t => {
          const occasion = t.occasion as Occasion;
          if (occasion === "Birthday" || occasion === "Anniversary") {
            next[occasion] = { id: t.id, occasion, subject: t.subject || "", body: t.body || "", flyerKey: t.flyerKey || "", active: !!t.active };
          }
        });
        return next;
      });
      setLoading(false);
    });
  }, []);

  const save = async (occasion: Occasion) => {
    setSaving(occasion);
    const row = rows[occasion];
    try {
      if (row.id) {
        await client.models.EmailTemplate.update({ id: row.id, subject: row.subject, body: row.body, flyerKey: row.flyerKey, active: row.active });
      } else {
        const res = await client.models.EmailTemplate.create({ id: uid(), occasion, subject: row.subject, body: row.body, flyerKey: row.flyerKey, active: row.active });
        if (res.data) setRows(prev => ({ ...prev, [occasion]: { ...prev[occasion], id: res.data!.id } }));
      }
      setToast(occasion + " template saved");
      window.setTimeout(() => setToast(""), 2600);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <p className="text-sm text-[#98a2b3]">Loading...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Automation</div>
        <h2 className="text-2xl font-black mt-0.5">Birthday &amp; Anniversary Emails</h2>
        <p className="text-sm text-[#667085] mt-1">
          Runs automatically every day at 9am ET. A template only sends while marked Active — add a Birthday to a
          client or prospect, or check a client's "Client since" date, to be included.
        </p>
      </div>

      {toast && <Pill tone="green">{toast}</Pill>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {OCCASIONS.map(def => (
          <TemplateCard
            key={def.key}
            def={def}
            row={rows[def.key]}
            onChange={next => setRows(prev => ({ ...prev, [def.key]: next }))}
            onSave={() => save(def.key)}
            saving={saving === def.key}
          />
        ))}
      </div>
    </div>
  );
}
