import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getUrl, remove, uploadData } from "aws-amplify/storage";
import { client } from "../client";
import { listAll } from "../sync";
import { RecordTable, TagPill, type ColumnDef } from "../RecordTable";
import { SearchSelect } from "../SearchSelect";
import { DBtn, DCard, DInput, DSelect, DTextarea, Field } from "../ui";
import {
  DOC_SLOTS, VISA_STATUSES, blankBeneficiary, blankQuestionnaire, docPaths, parseQuestionnaire, progress,
  type Applicant, type Beneficiary, type DocKey, type Questionnaire, type YesNo,
} from "../applications/questionnaire";
import type { Client, Db } from "../types";

export interface ApplicationRow {
  id: string;
  name: string;
  clientId?: string | null;
  status?: string | null;
  data?: string | null;
  updatedAt?: string;
}

const STATUSES = ["Draft", "Submitted"];

const updatedLabel = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function ApplicationsScreen({ db }: { db: Db }) {
  // Loaded here rather than in useDb on purpose: these hold SSNs and bank
  // numbers, and everything in useDb's Db goes into the JSON backup.
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [editing, setEditing] = useState<ApplicationRow | null>(null);

  const load = useCallback(() => {
    setState("loading");
    listAll<ApplicationRow>(client.models.Application as any)
      .then(rows => { setApps(rows); setState("ready"); })
      .catch(err => { console.error("Applications failed to load:", err); setState("error"); });
  }, []);
  useEffect(load, [load]);

  const save = async (rec: ApplicationRow, q: Questionnaire): Promise<ApplicationRow | null> => {
    const prev = apps.find(a => a.id === rec.id);
    const input = {
      id: rec.id,
      name: q.primary.person.fullName.trim() || "Untitled application",
      clientId: rec.clientId || null,
      status: rec.status || "Draft",
      data: JSON.stringify(q),
    };
    const res = prev ? await client.models.Application.update(input) : await client.models.Application.create(input);
    if (res.errors?.length || !res.data) {
      console.error("Application save failed:", res.errors);
      window.alert("The application could not be saved. Please try again.");
      return null;
    }
    // Files replaced or removed since the last save are no longer needed.
    const keep = new Set(docPaths(q));
    docPaths(parseQuestionnaire(prev?.data)).filter(p => !keep.has(p)).forEach(p => remove({ path: p }).catch(() => {}));
    const saved: ApplicationRow = { ...input, updatedAt: res.data.updatedAt };
    setApps(list => (prev ? list.map(a => (a.id === saved.id ? saved : a)) : [saved, ...list]));
    return saved;
  };

  const del = async (rec: ApplicationRow, draft?: Questionnaire) => {
    if (!window.confirm(`Delete ${rec.name}'s application and its uploaded documents? This can't be undone.`)) return false;
    const exists = apps.some(a => a.id === rec.id);
    if (exists) {
      const res = await client.models.Application.delete({ id: rec.id });
      if (res.errors?.length) { console.error("Application delete failed:", res.errors); window.alert("That application could not be deleted."); return false; }
    }
    const paths = new Set([...docPaths(parseQuestionnaire(rec.data)), ...(draft ? docPaths(draft) : [])]);
    paths.forEach(p => remove({ path: p }).catch(() => {}));
    setApps(list => list.filter(a => a.id !== rec.id));
    return true;
  };

  if (editing) {
    return (
      <ApplicationEditor
        key={editing.id}
        row={editing}
        isNew={!apps.some(a => a.id === editing.id)}
        clients={db.clients}
        onSave={save}
        onDelete={del}
        onClose={() => setEditing(null)}
      />
    );
  }

  const columns: ColumnDef<ApplicationRow>[] = [
    { key: "name", label: "Primary insured", render: r => <span className="font-medium">{r.name}</span>, sortValue: r => r.name },
    { key: "visa", label: "Visa / status", render: r => parseQuestionnaire(r.data).primary.person.visaStatus || "—" },
    { key: "spouse", label: "Spouse policy", render: r => (parseQuestionnaire(r.data).includeSpouse ? "Yes" : "No") },
    {
      key: "progress",
      label: "Sections done",
      render: r => { const p = progress(parseQuestionnaire(r.data)); return `${p.done} / ${p.total}`; },
    },
    { key: "docs", label: "Documents", render: r => docPaths(parseQuestionnaire(r.data)).length },
    { key: "status", label: "Status", render: r => <TagPill text={r.status || "Draft"} /> },
    { key: "updated", label: "Updated", render: r => updatedLabel(r.updatedAt), sortValue: r => r.updatedAt || "" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Book of business</div>
          <h2 className="text-2xl font-black mt-0.5">Applications</h2>
          <p className="text-sm text-[#667085] mt-1">Client questionnaires for life insurance applications: insured, beneficiaries, bank, health, spouse and H1B documents.</p>
        </div>
        <div className="flex items-center gap-2">
          <DBtn variant="secondary" onClick={load}>Refresh</DBtn>
          <DBtn onClick={() => setEditing({ id: newId(), name: "", status: "Draft", data: JSON.stringify(blankQuestionnaire()) })}>+ New application</DBtn>
        </div>
      </div>

      {state === "error" && (
        <p className="text-sm text-[#a4372f]">Applications couldn't be loaded. <button onClick={load} className="underline">Try again</button>.</p>
      )}
      {state === "loading" ? (
        <DCard className="p-5 text-sm text-[#98a2b3]">Loading…</DCard>
      ) : (
        <RecordTable<ApplicationRow>
          rows={apps}
          columns={columns}
          onEdit={setEditing}
          onDelete={r => { del(r); }}
          searchFn={(r, q) => r.name.toLowerCase().includes(q)}
        />
      )}
      <p className="text-xs text-[#98a2b3]">Applications hold SSNs and bank details, so they're not included in the JSON backup on the Data screen.</p>
    </div>
  );
}

// ---- Editor ---------------------------------------------------------------

function ApplicationEditor({
  row, isNew, clients, onSave, onDelete, onClose,
}: {
  row: ApplicationRow;
  isNew: boolean;
  clients: Client[];
  onSave: (rec: ApplicationRow, q: Questionnaire) => Promise<ApplicationRow | null>;
  onDelete: (rec: ApplicationRow, draft?: Questionnaire) => Promise<boolean>;
  onClose: () => void;
}) {
  const [saved, setSaved] = useState<{ row: ApplicationRow; q: Questionnaire; isNew: boolean }>(() => ({ row, q: parseQuestionnaire(row.data), isNew }));
  const [meta, setMeta] = useState({ clientId: row.clientId || "", status: row.status || "Draft" });
  const [q, setQ] = useState<Questionnaire>(saved.q);
  const [who, setWho] = useState<"primary" | "spouse">("primary");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const dirty =
    saved.isNew ||
    JSON.stringify(q) !== JSON.stringify(saved.q) ||
    meta.clientId !== (saved.row.clientId || "") ||
    meta.status !== (saved.row.status || "Draft");

  const applicant = q[who];
  const setApplicant = (next: Applicant) => setQ(prev => ({ ...prev, [who]: next }));

  const doSave = async () => {
    setBusy(true);
    const result = await onSave({ ...saved.row, ...meta }, q);
    setBusy(false);
    if (!result) return;
    setSaved({ row: result, q, isNew: false });
    setFlash("Saved");
    window.setTimeout(() => setFlash(""), 2000);
  };

  const close = () => {
    if (dirty && !window.confirm(saved.isNew ? "Discard this new application?" : "Discard your unsaved changes?")) return;
    // Files uploaded since the last save that the saved version doesn't use.
    const keep = new Set(docPaths(saved.q));
    docPaths(q).filter(p => !keep.has(p)).forEach(p => remove({ path: p }).catch(() => {}));
    onClose();
  };

  const doDelete = async () => {
    if (await onDelete(saved.row, q)) onClose();
  };

  const prefill = (c: Client) => {
    setMeta(m => ({ ...m, clientId: c.id }));
    setQ(prev => {
      const p = prev.primary.person;
      return {
        ...prev,
        primary: {
          ...prev.primary,
          person: {
            ...p,
            fullName: p.fullName || c.name || "",
            email: p.email || c.email || "",
            phone: p.phone || c.phone || "",
            address: p.address || c.address || "",
            dob: p.dob || c.birthday || "",
          },
        },
      };
    });
  };

  const title = q.primary.person.fullName.trim() || (saved.isNew ? "New application" : "Untitled application");

  return (
    <div className="flex flex-col gap-4 max-w-[960px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={close} className="text-xs text-[#667085] hover:text-[#0a0a0a]">← All applications</button>
          <h2 className="text-2xl font-black mt-1">{title}</h2>
          <p className="text-sm text-[#667085] mt-1">Fill this in accurately to the best of the client's knowledge for a trial application.</p>
        </div>
        <div className="flex items-center gap-2">
          {flash && <span className="text-xs font-semibold text-[#14683f]">{flash}</span>}
          {!dirty && !flash && <span className="text-xs text-[#98a2b3]">All changes saved</span>}
          <DBtn variant="secondary" onClick={close}>{dirty ? "Cancel" : "Done"}</DBtn>
          <DBtn onClick={doSave} disabled={busy || !dirty}>{busy ? "Saving…" : "Save"}</DBtn>
        </div>
      </div>

      <DCard className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Linked client (optional — fills in name, email, phone, address, DOB)">
          <SearchSelect options={clients} value={meta.clientId} labelOf={c => c.name} onSelect={prefill} placeholder="Search clients…" />
        </Field>
        <Field label="Status">
          <DSelect value={meta.status} onChange={e => setMeta(m => ({ ...m, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </DSelect>
        </Field>
        <Field label="Spouse is applying for a separate policy">
          <YesNoToggle
            value={q.includeSpouse ? "Yes" : "No"}
            onChange={v => { setQ(prev => ({ ...prev, includeSpouse: v === "Yes" })); if (v !== "Yes") setWho("primary"); }}
          />
        </Field>
      </DCard>

      {q.includeSpouse && (
        <div className="inline-flex p-1 rounded-full bg-[#eceef1] w-max sticky top-[72px] z-10">
          {(["primary", "spouse"] as const).map(k => (
            <button key={k} onClick={() => setWho(k)} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${who === k ? "bg-white shadow-sm" : "text-[#667085]"}`}>
              {k === "primary" ? "Primary insured" : "Spouse"}
            </button>
          ))}
        </div>
      )}

      <ApplicantForm
        key={who}
        who={who}
        appId={saved.row.id}
        value={applicant}
        onChange={setApplicant}
      />

      <div className="flex items-center justify-between gap-2 pt-2 pb-8">
        <DBtn variant="danger" onClick={doDelete}>{saved.isNew ? "Discard application" : "Delete application"}</DBtn>
        <DBtn onClick={doSave} disabled={busy || !dirty}>{busy ? "Saving…" : "Save"}</DBtn>
      </div>
    </div>
  );
}

function ApplicantForm({ who, appId, value, onChange }: { who: "primary" | "spouse"; appId: string; value: Applicant; onChange: (a: Applicant) => void }) {
  const p = value.person;
  const setP = (patch: Partial<Applicant["person"]>) => onChange({ ...value, person: { ...p, ...patch } });
  const setBank = (patch: Partial<Applicant["bank"]>) => onChange({ ...value, bank: { ...value.bank, ...patch } });
  const setHealth = (patch: Partial<Applicant["health"]>) => onChange({ ...value, health: { ...value.health, ...patch } });
  const isSpouse = who === "spouse";
  const txt = (key: keyof Applicant["person"], type = "text") => (
    <DInput type={type} value={p[key]} onChange={e => setP({ [key]: e.target.value })} />
  );

  return (
    <>
      <Section title={isSpouse ? "Spouse details" : "Primary insured information"}>
        <Grid>
          <Field label="Full name as per ID">{txt("fullName")}</Field>
          <Field label="Date of birth">{txt("dob", "date")}</Field>
          <Field label="Driver's license number">{txt("license")}</Field>
          <Field label="Phone">{txt("phone", "tel")}</Field>
          <Field label="Email">{txt("email", "email")}</Field>
          <Field label="SSN"><SecretInput value={p.ssn} onChange={v => setP({ ssn: v })} /></Field>
          <Wide><Field label="Home address">{txt("address")}</Field></Wide>
          <Field label="Profession">{txt("profession")}</Field>
          <Field label="Company they work for">{txt("employer")}</Field>
          <Field label="Working with this company since">{txt("employedSince", "date")}</Field>
          <Field label="Visa or immigrant status">
            <DSelect value={p.visaStatus} onChange={e => setP({ visaStatus: e.target.value })}>
              <option value="">Select…</option>
              {VISA_STATUSES.map(v => <option key={v}>{v}</option>)}
            </DSelect>
          </Field>
          <Field label="Country of birth">{txt("countryOfBirth")}</Field>
          <Field label="Existing life insurance outside of work?">
            <YesNoToggle value={p.existingInsurance} onChange={v => setP({ existingInsurance: v })} />
          </Field>
          {p.existingInsurance === "Yes" && (
            <>
              <Field label="Company name & policy numbers">{txt("existingPolicies")}</Field>
              <Field label="Face value of existing policies">{txt("existingFaceValue")}</Field>
            </>
          )}
        </Grid>
      </Section>

      <BeneficiaryList
        title="Beneficiaries"
        hint="Add as many beneficiaries as needed."
        list={value.beneficiaries}
        onChange={beneficiaries => onChange({ ...value, beneficiaries })}
      />
      <BeneficiaryList
        title="Contingent beneficiaries (after primary)"
        hint="Paid out if no primary beneficiary survives. Add as many as needed."
        list={value.contingent}
        onChange={contingent => onChange({ ...value, contingent })}
      />

      <Section
        title="Bank information"
        hint={isSpouse
          ? "The bank account will not be drafted until the client approves and accepts the policy."
          : "Lets the client secure coverage right away. The first payment may be drafted and is refunded if the client decides not to move forward."}
      >
        <Grid>
          <Field label="Bank name"><DInput placeholder="e.g. Bank of America" value={value.bank.bankName} onChange={e => setBank({ bankName: e.target.value })} /></Field>
          <Field label="Account number"><SecretInput value={value.bank.accountNumber} onChange={v => setBank({ accountNumber: v })} /></Field>
          <Field label="Routing number"><DInput inputMode="numeric" value={value.bank.routingNumber} onChange={e => setBank({ routingNumber: e.target.value })} /></Field>
        </Grid>
      </Section>

      <Section title="Health information">
        <Grid>
          <Field label="Blood pressure"><YesNoToggle value={value.health.bloodPressure} onChange={v => setHealth({ bloodPressure: v })} /></Field>
          <Field label="Diabetes"><YesNoToggle value={value.health.diabetes} onChange={v => setHealth({ diabetes: v })} /></Field>
          <Field label="Cholesterol"><YesNoToggle value={value.health.cholesterol} onChange={v => setHealth({ cholesterol: v })} /></Field>
          <Wide><Field label="Any other medical condition"><DTextarea rows={2} value={value.health.otherConditions} onChange={e => setHealth({ otherConditions: e.target.value })} /></Field></Wide>
          <Wide><Field label="Prescription medicine (names and how many mg)"><DTextarea rows={2} value={value.health.medications} onChange={e => setHealth({ medications: e.target.value })} /></Field></Wide>
          <Field label="Primary physician (PCP) full name"><DInput value={value.health.pcpName} onChange={e => setHealth({ pcpName: e.target.value })} /></Field>
          <Field label="PCP phone"><DInput type="tel" value={value.health.pcpPhone} onChange={e => setHealth({ pcpPhone: e.target.value })} /></Field>
          <Wide><Field label="PCP office address"><DInput value={value.health.pcpAddress} onChange={e => setHealth({ pcpAddress: e.target.value })} /></Field></Wide>
        </Grid>
      </Section>

      <Section title="H1B documents" hint="Needed when the applicant is on an H1B visa.">
        <div className="flex flex-col gap-2">
          {DOC_SLOTS.map(slot => (
            <DocSlot
              key={slot.key}
              label={slot.label}
              doc={value.docs[slot.key]}
              folder={`applications/${appId}/${who}-${slot.key}`}
              onChange={doc => {
                const docs = { ...value.docs };
                if (doc) docs[slot.key as DocKey] = doc; else delete docs[slot.key as DocKey];
                onChange({ ...value, docs });
              }}
            />
          ))}
        </div>
      </Section>
    </>
  );
}

function BeneficiaryList({ title, hint, list, onChange }: { title: string; hint: string; list: Beneficiary[]; onChange: (l: Beneficiary[]) => void }) {
  const set = (id: string, patch: Partial<Beneficiary>) => onChange(list.map(b => (b.id === id ? { ...b, ...patch } : b)));
  return (
    <Section title={title} hint={hint}>
      <div className="flex flex-col gap-3">
        {list.map((b, i) => (
          <div key={b.id} className="rounded-xl border border-[#eef0f3] bg-[#fafbfc] p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#475467]">#{i + 1}</span>
              <button onClick={() => onChange(list.filter(x => x.id !== b.id))} className="text-xs text-[#b4443a] hover:underline">Remove</button>
            </div>
            <Grid>
              <Field label="Full name as per ID"><DInput value={b.fullName} onChange={e => set(b.id, { fullName: e.target.value })} /></Field>
              <Field label="Relationship with insured"><DInput value={b.relationship} onChange={e => set(b.id, { relationship: e.target.value })} /></Field>
              <Field label="Date of birth"><DInput type="date" value={b.dob} onChange={e => set(b.id, { dob: e.target.value })} /></Field>
              <Field label="SSN"><SecretInput value={b.ssn} onChange={v => set(b.id, { ssn: v })} /></Field>
              <Field label="Phone number"><DInput type="tel" value={b.phone} onChange={e => set(b.id, { phone: e.target.value })} /></Field>
            </Grid>
          </div>
        ))}
        <div>
          <DBtn variant="secondary" onClick={() => onChange([...list, blankBeneficiary()])}>+ Add {list.length ? "another" : "one"}</DBtn>
        </div>
      </div>
    </Section>
  );
}

function DocSlot({ label, doc, folder, onChange }: { label: string; doc?: { path: string; name: string }; folder: string; onChange: (d: { path: string; name: string } | null) => void }) {
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");

  const upload = async (file: File) => {
    setState("uploading");
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
      const path = `${folder}-${Date.now()}-${safe}`;
      await uploadData({ path, data: file, options: { contentType: file.type || "application/octet-stream" } }).result;
      onChange({ path, name: file.name });
      setState("idle");
    } catch (err) {
      console.error("Upload failed:", err);
      setState("error");
    }
  };

  const open = async () => {
    if (!doc) return;
    // Open the tab first (synchronously, inside the click) so pop-up
    // blockers allow it, then point it at the signed URL.
    const tab = window.open("", "_blank");
    try {
      const { url } = await getUrl({ path: doc.path, options: { expiresIn: 300 } });
      if (tab) tab.location.href = url.toString(); else window.location.href = url.toString();
    } catch (err) {
      tab?.close();
      console.error("Couldn't open document:", err);
      window.alert("That document couldn't be opened.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[#f4f5f7] last:border-0 flex-wrap">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-[#98a2b3] truncate">
          {state === "uploading" ? "Uploading…" : state === "error" ? <span className="text-[#a4372f]">Upload failed — try again.</span> : doc ? doc.name : "Not uploaded"}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {doc && <DBtn variant="ghost" onClick={open}>Open</DBtn>}
        {doc && <DBtn variant="ghost" onClick={() => onChange(null)}>Remove</DBtn>}
        <label className={`inline-flex items-center justify-center rounded-full text-[13px] font-semibold px-4 py-2 border border-[#e5e5e5] bg-white text-[#344054] hover:bg-[#f5f5f5] cursor-pointer ${state === "uploading" ? "opacity-40 pointer-events-none" : ""}`}>
          {doc ? "Replace" : "Browse & upload"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload(f); }}
          />
        </label>
      </div>
    </div>
  );
}

// ---- Small pieces ---------------------------------------------------------

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <DCard className="p-5">
      <h4 className="text-base font-bold">{title}</h4>
      {hint && <p className="text-xs text-[#98a2b3] mt-1">{hint}</p>}
      <div className="mt-4">{children}</div>
    </DCard>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
const Wide = ({ children }: { children: ReactNode }) => <div className="md:col-span-2">{children}</div>;

function YesNoToggle({ value, onChange }: { value: YesNo; onChange: (v: YesNo) => void }) {
  return (
    <div className="inline-flex p-1 rounded-full bg-[#eceef1] w-max">
      {(["Yes", "No"] as const).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(value === v ? "" : v)}
          className={`px-5 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${value === v ? "bg-white shadow-sm text-[#0a0a0a]" : "text-[#667085]"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// Hidden by default so an SSN or account number isn't on screen while the
// agent shares their screen or works in public.
function SecretInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <DInput
        type={show ? "text" : "password"}
        autoComplete="new-password"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pr-16"
      />
      <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#667085] hover:text-[#0a0a0a]">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}
