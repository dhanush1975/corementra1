import type { ClientType, Db, LegacyClient, Prospect, Stage } from "./types";

// One person, one record. Everyone — met at an event, at a booth, or added
// by hand, prospect or client — is a row in db.prospects ("people"). A
// person is a client/partner when `clientType` is set; Sales, Purchases,
// Feedback and Applications point at the person's id through `clientId`.
//
// Two records are the same person when both the name and the email match
// (case and spacing ignored). The public-rsvp function applies the same
// rule to event registrations and booth analyses (see samePerson there).

export const normName = (s?: string | null) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
export const normEmail = (s?: string | null) => String(s || "").trim().toLowerCase();

export function samePerson(a: { name?: string | null; email?: string | null }, b: { name?: string | null; email?: string | null }) {
  const ea = normEmail(a.email);
  return !!ea && ea === normEmail(b.email) && !!normName(a.name) && normName(a.name) === normName(b.name);
}

export const isClient = (p: Prospect) => !!p.clientType;

// Every event a person registered for. `eventId` is the first (or the one
// picked in the form); `eventIds` collects later registrations.
export const eventsOf = (p: Prospect) => Array.from(new Set([p.eventId, ...(p.eventIds || [])].filter(Boolean)));

// Finds an existing person with the same name + email, other than `self`.
export const findDuplicate = (people: Prospect[], rec: Prospect) =>
  people.find(p => p.id !== rec.id && samePerson(p, rec));

// ---- Merging ----------------------------------------------------------------

const STAGE_RANK: Record<Stage, number> = { NEW: 0, CONTACTED: 1, APPOINTMENT: 2, "IN PROCESS": 3, CONVERTED: 5, "NOT INTERESTED": -1 };
const CLIENT_RANK: Record<string, number> = { "": 0, Client: 1, Partner: 1, Both: 2 };
const blank = (v: unknown) => v === undefined || v === null || v === "" || v === "Not captured yet" || v === "Not decided yet";

// Folds `others` into `keep`: keep's values win, blanks are filled from the
// others, notes are joined, events combined, and the furthest stage and
// client type are kept.
export function mergePerson(keep: Prospect, others: Prospect[]): Prospect {
  const out: any = { ...keep };
  for (const o of others) {
    for (const [k, v] of Object.entries(o)) {
      if (k === "id" || k === "notes" || k === "eventIds") continue;
      if (blank(out[k]) && !blank(v)) out[k] = v;
    }
  }
  const all = [keep, ...others];
  out.eventIds = Array.from(new Set(all.flatMap(eventsOf))).filter(e => e !== out.eventId);
  out.notes = Array.from(new Set(all.map(p => (p.notes || "").trim()).filter(Boolean))).join("\n\n");
  const live = all.filter(p => p.stage !== "NOT INTERESTED");
  out.stage = live.length ? live.reduce((a, b) => (STAGE_RANK[b.stage] > STAGE_RANK[a.stage] ? b : a)).stage : keep.stage;
  const ct = all.map(p => p.clientType || "").reduce((a, b) => (CLIENT_RANK[b] > CLIENT_RANK[a] ? b : a), "");
  if (ct) {
    out.clientType = ct;
    out.kind = "Client";
    out.since = all.map(p => p.since).filter(Boolean).sort()[0] || out.since;
  }
  out.lastContact = all.map(p => p.lastContact).filter(Boolean).sort().pop() || out.lastContact;
  if (out.stage !== keep.stage) out.completedAt = all.find(p => p.stage === out.stage)?.completedAt;
  return out as Prospect;
}

// Points every reference to an old person id at the new one.
export function remapDb(db: Db, idMap: Record<string, string>): Db {
  const to = (id: string) => idMap[id] ?? id;
  return {
    ...db,
    followUps: db.followUps.map(f => (f.prospectId && idMap[f.prospectId] ? { ...f, prospectId: to(f.prospectId) } : f)),
    purchases: db.purchases.map(p => (idMap[p.clientId] ? { ...p, clientId: to(p.clientId) } : p)),
    feedback: db.feedback.map(f => (idMap[f.clientId] ? { ...f, clientId: to(f.clientId) } : f)),
  };
}

// ---- Duplicates ---------------------------------------------------------------

export interface DuplicateGroup { key: string; people: Prospect[]; exact: boolean }

// Same name + email (exact) groups first, then "same name" groups where an
// email is missing or differs — those are only suggestions to check.
export function findDuplicateGroups(people: Prospect[]): DuplicateGroup[] {
  const byExact = new Map<string, Prospect[]>();
  for (const p of people) {
    const e = normEmail(p.email);
    if (!e || !normName(p.name)) continue;
    const k = normName(p.name) + "|" + e;
    byExact.set(k, [...(byExact.get(k) || []), p]);
  }
  const exact = [...byExact.entries()].filter(([, l]) => l.length > 1).map(([key, l]) => ({ key, people: l, exact: true }));
  const inExact = new Set(exact.flatMap(g => g.people.map(p => p.id)));

  const byName = new Map<string, Prospect[]>();
  for (const p of people) {
    const n = normName(p.name);
    if (!n) continue;
    byName.set(n, [...(byName.get(n) || []), p]);
  }
  const loose = [...byName.entries()]
    .filter(([, l]) => l.length > 1 && l.some(p => !inExact.has(p.id)))
    .filter(([, l]) => new Set(l.map(p => normEmail(p.email))).size > 1 || l.some(p => !normEmail(p.email)))
    .map(([key, l]) => ({ key: "name|" + key, people: l, exact: false }));
  return [...exact, ...loose];
}

// The record to keep by default: a client over a prospect, then the one
// furthest along, then the one with the most filled-in details.
export function pickKeeper(people: Prospect[]): Prospect {
  const score = (p: Prospect) =>
    (p.clientType ? 1000 : 0) + (STAGE_RANK[p.stage] + 1) * 100 + Object.values(p).filter(v => !blank(v)).length;
  return people.slice().sort((a, b) => score(b) - score(a))[0];
}

// ---- Old Clients table ----------------------------------------------------------

// Folds records from the old, separate Clients table into people. A client
// joins the person it came from (its prospectId, the "<prospect id>-c" id
// the old Convert button made, or the same name + email); otherwise it
// becomes a new person that keeps the client's id, so its sales, purchases
// and feedback still point at it. Returns the new people list and the
// client-id → person-id changes that references need.
export function absorbClients(people: Prospect[], clients: LegacyClient[]): { people: Prospect[]; idMap: Record<string, string> } {
  const list = people.slice();
  const idMap: Record<string, string> = {};
  for (const c of clients) {
    const asPerson: Prospect = {
      id: c.id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      clientType: (c.type || "Client") as ClientType,
      since: c.since || "",
      agent: c.agent || "",
      source: c.source || "Not captured yet",
      birthday: c.birthday || "",
      eventId: "",
      need: "Not captured yet",
      stage: "CONVERTED",
      plan: "Not decided yet",
      lastContact: c.since || "",
      notes: "",
      kind: "Client",
      completedAt: c.since ? new Date(c.since + "T00:00:00").toISOString() : undefined,
    };
    const i = list.findIndex(p =>
      p.id === c.id || (c.prospectId && p.id === c.prospectId) || p.id + "-c" === c.id || samePerson(p, c));
    if (i < 0) { list.push(asPerson); continue; }
    const target = list[i];
    // The client record's own details are the more recent ones.
    list[i] = mergePerson({ ...target, clientType: asPerson.clientType, since: asPerson.since || target.since, address: asPerson.address || target.address || "", kind: "Client" }, [asPerson]);
    list[i].id = target.id;
    if (target.id !== c.id) idMap[c.id] = target.id;
  }
  return { people: list, idMap };
}

// Before saving a person from a form: a client gets kind/since filled in,
// and becoming a client moves them to Converted.
export function normalizeForSave(rec: Prospect, prev?: Prospect): Prospect {
  const out: Prospect = { ...rec, kind: rec.clientType ? "Client" : rec.kind === "Client" ? "Prospect" : rec.kind || "Prospect" };
  if (out.clientType && !out.since) out.since = new Date().toISOString().slice(0, 10);
  if (out.clientType && !prev?.clientType && out.stage !== "CONVERTED") {
    out.stage = "CONVERTED";
    out.completedAt = new Date().toISOString();
  }
  return out;
}

// The message shown instead of saving a copy of someone who already exists.
export const duplicateMessage = (existing: Prospect) =>
  `${existing.name} (${existing.email}) is already in your records${existing.clientType ? " as a " + existing.clientType.toLowerCase() : ""}. ` +
  "Update that record instead of adding a copy?";

// Whether an old Clients-table row already has its person (combined
// earlier). The old rows are kept as a backup, so this is how the
// dashboard knows not to offer them again.
export function isAbsorbed(c: LegacyClient, people: Prospect[]) {
  return people.some(p =>
    p.id === c.id ||
    (!!p.clientType && (p.id + "-c" === c.id || (!!c.prospectId && p.id === c.prospectId) || samePerson(p, c))));
}
