import { useState, type ReactNode } from "react";
import { DBtn, DCard, DInput, DSelect, DTextarea, Field } from "../ui";
import { PersonAutocomplete } from "../PersonAutocomplete";
import type { Prospect } from "../types";
import {
  DOC_SLOTS, VISA_STATUSES, blankBeneficiary,
  type Applicant, type Beneficiary, type DocKey, type DocRef, type Questionnaire, type YesNo,
} from "./questionnaire";

// The questionnaire form, shared by the dashboard editor and the public
// /apply/<token> page the client fills in. Documents go through `docs`:
// the dashboard can upload and open them, the public page can only upload.

export type Who = "primary" | "spouse";

export interface DocActions {
  upload: (who: Who, slot: DocKey, file: File) => Promise<DocRef>;
  open?: (doc: DocRef) => Promise<string>;
}

// A short-lived S3 POST form from the applications function.
export interface UploadTicket { url: string; path: string; fields: string }

const UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"];
const UPLOAD_MAX = 10 * 1024 * 1024;

export function checkUpload(file: File): string | null {
  if (!UPLOAD_TYPES.includes(file.type)) return "Please upload a PDF or a photo (JPG, PNG, HEIC).";
  if (file.size > UPLOAD_MAX) return "Files must be under 10 MB.";
  return null;
}

export async function postUpload(ticket: UploadTicket, file: File): Promise<void> {
  const form = new FormData();
  Object.entries(JSON.parse(ticket.fields) as Record<string, string>).forEach(([k, v]) => form.append(k, v));
  form.append("file", file);
  const res = await fetch(ticket.url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}

export function ApplicationForm({
  value, onChange, docs, audience, people, onPickPerson,
}: {
  value: Questionnaire;
  onChange: (q: Questionnaire) => void;
  docs: DocActions;
  audience: "agent" | "client";
  // Dashboard only: suggest people from your records in the name fields.
  // Never passed on the client's public page.
  people?: Prospect[];
  onPickPerson?: (who: Who, p: Prospect) => void;
}) {
  const [who, setWho] = useState<Who>("primary");
  const setApplicant = (next: Applicant) => onChange({ ...value, [who]: next });

  return (
    <div className="flex flex-col gap-4">
      <Section title={audience === "client" ? "Is your spouse applying for a separate policy?" : "Spouse is applying for a separate policy"}>
        <YesNoToggle
          value={value.includeSpouse ? "Yes" : "No"}
          onChange={v => { onChange({ ...value, includeSpouse: v === "Yes" }); if (v !== "Yes") setWho("primary"); }}
        />
        {audience === "client" && <p className="text-xs text-[#98a2b3] mt-2">Only fill in spouse details if your spouse is applying for their own policy.</p>}
      </Section>

      {value.includeSpouse && (
        <div className="inline-flex p-1 rounded-full bg-[#eceef1] w-max sticky top-[72px] z-10 shadow-sm">
          {(["primary", "spouse"] as const).map(k => (
            <button key={k} type="button" onClick={() => setWho(k)} className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${who === k ? "bg-white shadow-sm" : "text-[#667085]"}`}>
              {k === "primary" ? "Primary insured" : "Spouse"}
            </button>
          ))}
        </div>
      )}

      <ApplicantForm
        key={who}
        who={who}
        value={value[who]}
        onChange={setApplicant}
        docs={docs}
        people={people}
        onPick={p => {
          // Fill in this applicant from the picked record (only fields the
          // record actually has), then let the screen link the person.
          const cur = value[who].person;
          setApplicant({
            ...value[who],
            person: {
              ...cur,
              fullName: p.name || cur.fullName,
              email: p.email || cur.email,
              phone: p.phone || cur.phone,
              address: p.address || cur.address,
              dob: p.birthday || cur.dob,
            },
          });
          onPickPerson?.(who, p);
        }}
      />
    </div>
  );
}

function ApplicantForm({
  who, value, onChange, docs, people, onPick,
}: {
  who: Who;
  value: Applicant;
  onChange: (a: Applicant) => void;
  docs: DocActions;
  people?: Prospect[];
  onPick: (p: Prospect) => void;
}) {
  const p = value.person;
  const setP = (patch: Partial<Applicant["person"]>) => onChange({ ...value, person: { ...p, ...patch } });
  const setBank = (patch: Partial<Applicant["bank"]>) => onChange({ ...value, bank: { ...value.bank, ...patch } });
  const setHealth = (patch: Partial<Applicant["health"]>) => onChange({ ...value, health: { ...value.health, ...patch } });
  const isSpouse = who === "spouse";
  const txt = (key: keyof Applicant["person"], type = "text", extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <DInput type={type} value={p[key]} onChange={e => setP({ [key]: e.target.value })} {...extra} />
  );

  return (
    <>
      <Section title={isSpouse ? "Spouse details" : "Primary insured information"}>
        <Grid>
          <Field label="Full name as per ID">
            {people ? (
              <PersonAutocomplete value={p.fullName} onChange={v => setP({ fullName: v })} people={people} onPick={onPick} placeholder="Type a name — matches from your records appear" />
            ) : txt("fullName", "text", { autoComplete: "off" })}
          </Field>
          <Field label="Date of birth">{txt("dob", "date")}</Field>
          <Field label="Driver's license number">{txt("license", "text", { autoComplete: "off" })}</Field>
          <Field label="Phone">{txt("phone", "tel")}</Field>
          <Field label="Email">{txt("email", "email")}</Field>
          <Field label="SSN"><SecretInput value={p.ssn} onChange={v => setP({ ssn: v })} /></Field>
          <Wide><Field label="Home address">{txt("address")}</Field></Wide>
          <Field label="Profession">{txt("profession")}</Field>
          <Field label="Company you work for">{txt("employer")}</Field>
          <Field label="Working with this company since">{txt("employedSince", "date")}</Field>
          <Field label="Visa or immigrant status">
            <DSelect value={p.visaStatus} onChange={e => setP({ visaStatus: e.target.value })}>
              <option value="">Select…</option>
              {VISA_STATUSES.map(v => <option key={v}>{v}</option>)}
            </DSelect>
          </Field>
          <Field label="Country of birth">{txt("countryOfBirth")}</Field>
          <Field label="Any existing life insurance outside of work?">
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
        hint="Add as many beneficiaries as you want."
        list={value.beneficiaries}
        onChange={beneficiaries => onChange({ ...value, beneficiaries })}
      />
      <BeneficiaryList
        title="Contingent beneficiaries (after primary)"
        hint="Paid if no primary beneficiary survives. Add as many as you want."
        list={value.contingent}
        onChange={contingent => onChange({ ...value, contingent })}
      />

      <Section
        title="Bank information"
        hint={isSpouse
          ? "The bank account will not be drafted until you approve and accept the policy."
          : "Providing bank information helps secure coverage right away if anything happens. The first payment may be drafted and will be refunded if you decide not to move forward."}
      >
        <Grid>
          <Field label="Bank name"><DInput placeholder="e.g. Bank of America" value={value.bank.bankName} onChange={e => setBank({ bankName: e.target.value })} /></Field>
          <Field label="Account number"><SecretInput value={value.bank.accountNumber} onChange={v => setBank({ accountNumber: v })} /></Field>
          <Field label="Routing number"><DInput inputMode="numeric" autoComplete="off" value={value.bank.routingNumber} onChange={e => setBank({ routingNumber: e.target.value })} /></Field>
        </Grid>
      </Section>

      <Section title="Health information">
        <Grid>
          <Field label="Blood pressure"><YesNoToggle value={value.health.bloodPressure} onChange={v => setHealth({ bloodPressure: v })} /></Field>
          <Field label="Diabetes"><YesNoToggle value={value.health.diabetes} onChange={v => setHealth({ diabetes: v })} /></Field>
          <Field label="Cholesterol"><YesNoToggle value={value.health.cholesterol} onChange={v => setHealth({ cholesterol: v })} /></Field>
          <Wide><Field label="Any other medical condition"><DTextarea rows={2} value={value.health.otherConditions} onChange={e => setHealth({ otherConditions: e.target.value })} /></Field></Wide>
          <Wide><Field label="Prescription medicine, if any (names and how many mg)"><DTextarea rows={2} value={value.health.medications} onChange={e => setHealth({ medications: e.target.value })} /></Field></Wide>
          <Field label="Primary physician (PCP) full name"><DInput value={value.health.pcpName} onChange={e => setHealth({ pcpName: e.target.value })} /></Field>
          <Field label="PCP phone"><DInput type="tel" value={value.health.pcpPhone} onChange={e => setHealth({ pcpPhone: e.target.value })} /></Field>
          <Wide><Field label="PCP office address"><DInput value={value.health.pcpAddress} onChange={e => setHealth({ pcpAddress: e.target.value })} /></Field></Wide>
        </Grid>
      </Section>

      <Section title="H1B documents" hint="Only if you are on an H1B visa. PDF or photo, up to 10 MB each.">
        <div className="flex flex-col gap-2">
          {DOC_SLOTS.map(slot => (
            <DocSlot
              key={slot.key}
              label={slot.label}
              doc={value.docs[slot.key]}
              upload={file => docs.upload(who, slot.key, file)}
              open={docs.open}
              onChange={doc => {
                const next = { ...value.docs };
                if (doc) next[slot.key] = doc; else delete next[slot.key];
                onChange({ ...value, docs: next });
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
              <button type="button" onClick={() => onChange(list.filter(x => x.id !== b.id))} className="text-xs text-[#b4443a] hover:underline">Remove</button>
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
        {list.length < 10 && (
          <div>
            <DBtn variant="secondary" onClick={() => onChange([...list, blankBeneficiary()])}>+ Add {list.length ? "another" : "one"}</DBtn>
          </div>
        )}
      </div>
    </Section>
  );
}

function DocSlot({
  label, doc, upload, open, onChange,
}: {
  label: string;
  doc?: DocRef;
  upload: (file: File) => Promise<DocRef>;
  open?: (doc: DocRef) => Promise<string>;
  onChange: (d: DocRef | null) => void;
}) {
  const [state, setState] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState("");

  const pick = async (file: File) => {
    const problem = checkUpload(file);
    if (problem) { setError(problem); return; }
    setError("");
    setState("uploading");
    try {
      onChange(await upload(file));
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Upload failed — please try again.");
    } finally {
      setState("idle");
    }
  };

  const view = async () => {
    if (!doc || !open) return;
    // Open the tab inside the click so pop-up blockers allow it, then point
    // it at the short-lived link.
    const tab = window.open("", "_blank");
    try {
      const url = await open(doc);
      if (tab) tab.location.href = url; else window.location.href = url;
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
          {state === "uploading" ? "Uploading…" : error ? <span className="text-[#a4372f]">{error}</span> : doc ? `✓ ${doc.name}` : "Not uploaded"}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {doc && open && <DBtn variant="ghost" onClick={view}>Open</DBtn>}
        {doc && <DBtn variant="ghost" onClick={() => onChange(null)}>Remove</DBtn>}
        <label className={`inline-flex items-center justify-center rounded-full text-[13px] font-semibold px-4 py-2 border border-[#e5e5e5] bg-white text-[#344054] hover:bg-[#f5f5f5] cursor-pointer ${state === "uploading" ? "opacity-40 pointer-events-none" : ""}`}>
          {doc ? "Replace" : "Browse & upload"}
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/heic,image/heif,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }}
          />
        </label>
      </div>
    </div>
  );
}

// ---- Small pieces ---------------------------------------------------------

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
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

// Hidden by default so an SSN or account number isn't on screen while
// someone looks over a shoulder or the screen is shared.
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
