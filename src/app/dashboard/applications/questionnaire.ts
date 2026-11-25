// The client application questionnaire (the "Client Questionnaire" PDF):
// the primary insured, their beneficiaries, bank and health details, an
// optional spouse applying for their own policy, and the H1B documents.
// Stored as JSON in Application.data.

export type YesNo = "" | "Yes" | "No";

export const VISA_STATUSES = ["H1B", "H4", "L1", "L2", "F1", "Green Card", "Citizen", "Other"];

export interface Person {
  fullName: string;
  dob: string;
  license: string;
  phone: string;
  address: string;
  email: string;
  ssn: string;
  profession: string;
  employer: string;
  employedSince: string;
  visaStatus: string;
  countryOfBirth: string;
  existingInsurance: YesNo;
  existingPolicies: string;
  existingFaceValue: string;
}

export interface Beneficiary {
  id: string;
  fullName: string;
  dob: string;
  ssn: string;
  phone: string;
  relationship: string;
}

export interface Bank {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
}

export interface Health {
  bloodPressure: YesNo;
  diabetes: YesNo;
  cholesterol: YesNo;
  otherConditions: string;
  medications: string;
  pcpName: string;
  pcpAddress: string;
  pcpPhone: string;
}

// A file uploaded to storage under applications/<application id>/.
export interface DocRef {
  path: string;
  name: string;
}

export const DOC_SLOTS = [
  { key: "h1bStamp", label: "H1B stamp in passport" },
  { key: "i797", label: "H1B I-797" },
  { key: "w9", label: "Form W-9" },
] as const;
export type DocKey = (typeof DOC_SLOTS)[number]["key"];

export interface Applicant {
  person: Person;
  beneficiaries: Beneficiary[];
  contingent: Beneficiary[];
  bank: Bank;
  health: Health;
  docs: Partial<Record<DocKey, DocRef>>;
}

export interface Questionnaire {
  primary: Applicant;
  // Only when the spouse is applying for a separate policy.
  includeSpouse: boolean;
  spouse: Applicant;
}

const newId = () => Math.random().toString(36).slice(2, 9);

export const blankBeneficiary = (): Beneficiary => ({ id: newId(), fullName: "", dob: "", ssn: "", phone: "", relationship: "" });

const blankApplicant = (): Applicant => ({
  person: {
    fullName: "", dob: "", license: "", phone: "", address: "", email: "", ssn: "", profession: "",
    employer: "", employedSince: "", visaStatus: "", countryOfBirth: "", existingInsurance: "",
    existingPolicies: "", existingFaceValue: "",
  },
  beneficiaries: [blankBeneficiary()],
  contingent: [blankBeneficiary()],
  bank: { bankName: "", accountNumber: "", routingNumber: "" },
  health: {
    bloodPressure: "", diabetes: "", cholesterol: "", otherConditions: "", medications: "",
    pcpName: "", pcpAddress: "", pcpPhone: "",
  },
  docs: {},
});

export const blankQuestionnaire = (): Questionnaire => ({ primary: blankApplicant(), includeSpouse: false, spouse: blankApplicant() });

// Fills in anything missing from older or partial JSON, so the editor can
// always rely on every field existing.
export function parseQuestionnaire(json?: string | null): Questionnaire {
  const blank = blankQuestionnaire();
  let raw: any = {};
  try { raw = json ? JSON.parse(json) : {}; } catch { raw = {}; }
  const applicant = (a: any, b: Applicant): Applicant => ({
    person: { ...b.person, ...(a?.person || {}) },
    beneficiaries: Array.isArray(a?.beneficiaries) ? a.beneficiaries.map((x: any) => ({ ...blankBeneficiary(), ...x })) : b.beneficiaries,
    contingent: Array.isArray(a?.contingent) ? a.contingent.map((x: any) => ({ ...blankBeneficiary(), ...x })) : b.contingent,
    bank: { ...b.bank, ...(a?.bank || {}) },
    health: { ...b.health, ...(a?.health || {}) },
    docs: { ...(a?.docs || {}) },
  });
  return {
    primary: applicant(raw.primary, blank.primary),
    includeSpouse: !!raw.includeSpouse,
    spouse: applicant(raw.spouse, blank.spouse),
  };
}

// ---- Server-side cleaning ---------------------------------------------
// Used by amplify/functions/applications before anything is encrypted and
// stored: the result holds only the known fields, as capped plain strings,
// whatever the caller sent.

const TEXT_MAX = 300;
const LONG_MAX = 2000;
const LIST_MAX = 10;
const LONG_FIELDS = new Set(["otherConditions", "medications"]);
const YES_NO_FIELDS = new Set(["existingInsurance", "bloodPressure", "diabetes", "cholesterol"]);
const DOC_NAME_RE = /^[^\u0000-\u001F/\\]{1,200}$/;

const cleanStr = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "";

function cleanFields<T extends Record<string, any>>(raw: any, blank: T): T {
  const out: Record<string, any> = {};
  for (const key of Object.keys(blank)) {
    const v = cleanStr(raw?.[key], LONG_FIELDS.has(key) ? LONG_MAX : TEXT_MAX);
    out[key] = YES_NO_FIELDS.has(key) ? (v === "Yes" || v === "No" ? v : "") : v;
  }
  return out as T;
}

const cleanList = (raw: any): Beneficiary[] =>
  (Array.isArray(raw) ? raw : []).slice(0, LIST_MAX).map(b => {
    const { id: _id, ...fields } = blankBeneficiary();
    return { ...cleanFields(b, fields), id: /^[a-z0-9]{1,16}$/.test(b?.id) ? b.id : newId() };
  });

// `docPrefix` is "applications/<application id>/": a document is kept only
// if it lives in that application's own folder.
export function docPathOk(path: unknown, docPrefix: string): path is string {
  return typeof path === "string" && path.startsWith(docPrefix) && /^[\w./-]{1,300}$/.test(path) && !path.includes("..");
}

export function cleanQuestionnaire(raw: any, docPrefix: string): Questionnaire {
  const blank = blankQuestionnaire();
  const applicant = (a: any, b: Applicant): Applicant => {
    const docs: Applicant["docs"] = {};
    for (const { key } of DOC_SLOTS) {
      const d = a?.docs?.[key];
      const name = cleanStr(d?.name, 200);
      if (docPathOk(d?.path, docPrefix) && DOC_NAME_RE.test(name)) docs[key] = { path: d.path, name };
    }
    return {
      person: cleanFields(a?.person, b.person),
      beneficiaries: cleanList(a?.beneficiaries),
      contingent: cleanList(a?.contingent),
      bank: cleanFields(a?.bank, b.bank),
      health: cleanFields(a?.health, b.health),
      docs,
    };
  };
  return {
    primary: applicant(raw?.primary, blank.primary),
    includeSpouse: raw?.includeSpouse === true,
    spouse: applicant(raw?.spouse, blank.spouse),
  };
}

// Every storage path a questionnaire points at.
export function docPaths(q: Questionnaire): string[] {
  return [q.primary, q.spouse].flatMap(a => Object.values(a.docs).filter((d): d is DocRef => !!d).map(d => d.path));
}
