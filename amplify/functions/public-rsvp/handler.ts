import { randomUUID } from 'node:crypto';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/public-rsvp';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

// Mirrors NEEDS in src/app/dashboard/data.ts — the only values the public
// form's "Interested In" dropdown can produce.
const NEEDS = ['Not captured yet', 'Professional Business Opportunity', 'Will and Trust Planning', 'High Net Worth Estate Planning', 'Tax Free Legacy Transfer', 'Tax Free Retirement Planning', '401K Rollover', 'Protect IRA/401K From Market Risk', 'Kids College Savings Plan', 'Term & Cash Value Life Insurance', 'Guaranteed Lifetime Income Annuity', 'Long Term Care & Living Benefits'];

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// Letters (any script), spaces and the punctuation real names use. No
// digits, slashes, colons or "@", so a name can't carry a URL or address
// into the dashboard, a CSV export or a {{name}} email merge.
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]{0,79}$/u;
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const PHONE_RE = /^[+(]?[0-9][0-9 ().-]{5,24}$/;
const NOTES_MAX = 1000;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
// Drops control characters (keeps newlines/tabs) so notes are plain text.
const cleanText = (v: string) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

// ---- One record per person ----------------------------------------------
// Same rule as src/app/dashboard/people.ts — the same name and email are the
// same person — with one extra check, because anyone can fill in these
// public forms: if the record on file has a phone number, the phone given
// must match it too (last 10 digits). Then a registration or booth analysis
// is attached to that record instead of creating a copy. If the phone
// differs, a separate record is made and the dashboard's Duplicates tool
// shows the pair, so you decide.
//
// A public form never changes an existing person's details: it can only
// add the event to their list and update the last-contact date (a booth
// analysis is stored as its own entry). Stage, phone, need, notes and
// "Not interested" stay exactly as you set them.

const normName = (s?: string | null) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const normEmail = (s?: string | null) => String(s || '').trim().toLowerCase();
const phoneKey = (s?: string | null) => String(s || '').replace(/\D/g, '').slice(-10);

async function findPerson(name: string, email: string, phone: string) {
  const n = normName(name);
  const e = normEmail(email);
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Prospect.list({ limit: 1000, nextToken, selectionSet: ['id', 'name', 'email', 'phone'] });
    if (res.errors?.length) throw new Error('Could not look up existing people');
    const hit = res.data.find(p =>
      normEmail(p.email) === e && normName(p.name) === n && (!phoneKey(p.phone) || phoneKey(p.phone) === phoneKey(phone)));
    if (hit) {
      const { data } = await client.models.Prospect.get({ id: hit.id });
      if (data) return data;
    }
    nextToken = res.nextToken;
  } while (nextToken);
  return null;
}

async function findEvent(id: string) {
  if (!ID_RE.test(id)) return null;
  const { data } = await client.models.Event.get({ id });
  return data ?? null;
}

async function getPublicEvent(args: Record<string, unknown>) {
  const event = await findEvent(str(args.id));
  // Only what the registration page shows — never expense or attendance.
  return event ? { id: event.id, name: event.name, status: event.status } : null;
}

async function registerForEvent(args: Record<string, unknown>) {
  const name = str(args.name).replace(/\s+/g, ' ');
  const email = str(args.email).toLowerCase();
  const phone = str(args.phone);
  const interest = str(args.interest);
  const notes = cleanText(str(args.notes));

  if (!NAME_RE.test(name)) throw new Error('Please enter a valid name.');
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Error('Please enter a valid email address.');
  if (!PHONE_RE.test(phone)) throw new Error('Please enter a valid phone number.');
  if (notes.length > NOTES_MAX) throw new Error(`Please keep your message under ${NOTES_MAX} characters.`);

  const event = await findEvent(str(args.eventId));
  if (!event) throw new Error('This registration link is not valid.');
  if (event.status === 'Completed') throw new Error('This event has already taken place.');

  const today = new Date().toISOString().slice(0, 10);
  const existing = await findPerson(name, email, phone);
  if (existing) {
    // Only the event and the contact date — nothing the visitor typed is
    // written onto an existing record.
    const eventIds = (existing.eventIds ?? []).filter((x): x is string => !!x);
    const first = existing.eventId || event.id;
    if (first !== event.id && !eventIds.includes(event.id)) eventIds.push(event.id);
    const { errors } = await client.models.Prospect.update({
      id: existing.id,
      eventId: first,
      eventIds,
      lastContact: today,
    });
    if (errors?.length) {
      console.error('Prospect update failed', errors);
      throw new Error('We could not save your details — please try again.');
    }
    return true;
  }

  // Everything below the contact details is decided here, not by the
  // caller: a visitor can't pick a stage, an agent, a record type or a
  // birthday (which would enrol the address in automated emails).
  const { errors } = await client.models.Prospect.create({
    id: randomUUID(),
    name,
    email,
    phone,
    eventId: event.id,
    source: 'Event / Workshop',
    need: NEEDS.includes(interest) ? interest : NEEDS[0],
    agent: '',
    stage: 'APPOINTMENT',
    plan: 'Not decided yet',
    lastContact: new Date().toISOString().slice(0, 10),
    notes: notes || 'Submitted via event registration link.',
    kind: 'Prospect',
  });
  if (errors?.length) {
    console.error('Prospect create failed', errors);
    throw new Error('We could not save your details — please try again.');
  }
  return true;
}

// ---- Booths ------------------------------------------------------------

// Mirrors src/app/booth/fna.ts. The analysis is rebuilt from these lists
// rather than stored as sent, so nothing but known keys with clamped
// numbers, Y/N answers and A/B/C choices ever reaches the table.
const VALUE_KEYS = ['debt', 'inc', 'years', 'mortgage', 'eduCost', 'eduYears', 'kids', 'savings', 'stocks', 'realEstate', 'insurance', 'metals', 'crypto', 'k401'];
const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];
// Answered on a 1–10 scale ("1"…"10") instead of Y/N.
const SCALE_KEYS = ['q3'];
const SCALE_RE = /^(10|[1-9])$/;
const OPTION_IDS = ['A', 'B', 'C'];
const ANALYSIS_MAX = 8000;
const MAX_AMOUNT = 1e11;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// The two people's labels ("Husband", "Wife", or real names).
const PERSON_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]{0,39}$/u;

function cleanAnalysis(raw: string) {
  if (raw.length > ANALYSIS_MAX) throw new Error('This analysis is too large to save.');
  let a: any;
  try { a = JSON.parse(raw); } catch { throw new Error('This analysis could not be read.'); }
  const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(MAX_AMOUNT, Math.max(0, Math.round(n))) : 0);
  const person = (p: unknown, fallback: string) => {
    const s = str(p).replace(/\s+/g, ' ');
    return PERSON_RE.test(s) ? s : fallback;
  };
  const v: Record<string, number> = {};
  for (const k of VALUE_KEYS) v[k] = num(a?.v?.[k]);
  const ans: Record<string, string> = {};
  for (const k of QUESTION_KEYS) {
    const val = a?.ans?.[k];
    if (typeof val !== 'string') continue;
    if (SCALE_KEYS.includes(k) ? SCALE_RE.test(val) : val === 'Y' || val === 'N') ans[k] = val;
  }
  const pick = (c: unknown) => (typeof c === 'string' && OPTION_IDS.includes(c) ? c : '');
  return {
    v,
    p1: person(a?.p1, 'Person 1'),
    p2: person(a?.p2, 'Person 2'),
    r1: Math.min(100, num(a?.r1)),
    ans,
    booked: a?.booked === true,
    choice: [pick(a?.choice?.[0]), pick(a?.choice?.[1])],
  };
}

async function findBooth(id: string) {
  if (!ID_RE.test(id)) return null;
  const { data } = await client.models.Booth.get({ id });
  return data ?? null;
}

async function getPublicBooth(args: Record<string, unknown>) {
  const booth = await findBooth(str(args.id));
  return booth ? { id: booth.id, name: booth.name, status: booth.status } : null;
}

async function saveBoothAnalysis(args: Record<string, unknown>) {
  const name = str(args.name).replace(/\s+/g, ' ');
  const email = str(args.email).toLowerCase();
  const phone = str(args.phone);
  const entryId = str(args.entryId);

  if (!NAME_RE.test(name)) throw new Error('Please enter a valid name.');
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Error('Please enter a valid email address.');
  if (!PHONE_RE.test(phone)) throw new Error('Please enter a valid phone number.');
  const analysis = JSON.stringify(cleanAnalysis(str(args.analysis)));

  const booth = await findBooth(str(args.boothId));
  if (!booth) throw new Error('This booth link is not valid.');
  if (booth.status === 'Completed') throw new Error('This booth has closed.');
  const savedAt = new Date().toISOString();

  if (entryId) {
    if (!UUID_RE.test(entryId)) throw new Error('This analysis could not be found.');
    const { data: existing } = await client.models.BoothEntry.get({ id: entryId });
    if (!existing || existing.boothId !== booth.id) throw new Error('This analysis could not be found.');
    // Contact details are fixed once the entry exists; only the analysis moves.
    const { errors } = await client.models.BoothEntry.update({ id: entryId, analysis, savedAt });
    if (errors?.length) {
      console.error('BoothEntry update failed', errors);
      throw new Error('We could not save this analysis — please try again.');
    }
    // Booking a meeting from the page moves the lead on, as an event
    // registration does — but never back from a later stage.
    if (JSON.parse(analysis).booked && existing.prospectId) {
      const { data: prospect } = await client.models.Prospect.get({ id: existing.prospectId });
      if (prospect?.stage === 'NEW') {
        const { errors: stageErrors } = await client.models.Prospect.update({ id: prospect.id, stage: 'APPOINTMENT', lastContact: savedAt.slice(0, 10) });
        if (stageErrors?.length) console.error('Prospect stage update failed', stageErrors);
      }
    }
    return entryId;
  }

  // Someone already on file gets the analysis as its own entry linked to
  // their record; the record itself only gets a new contact date.
  const existing = await findPerson(name, email, phone);
  if (existing) {
    const { errors: updateErrors } = await client.models.Prospect.update({
      id: existing.id,
      lastContact: savedAt.slice(0, 10),
    });
    if (updateErrors?.length) console.error('Prospect update failed', updateErrors);
    const id = randomUUID();
    const { errors } = await client.models.BoothEntry.create({ id, boothId: booth.id, prospectId: existing.id, name, email, phone, analysis, savedAt });
    if (errors?.length) {
      console.error('BoothEntry create failed', errors);
      throw new Error('We could not save your details — please try again.');
    }
    return id;
  }

  // As with event registrations, the visitor decides only the contact
  // details; how the lead is filed is fixed here.
  const prospectId = randomUUID();
  const { errors: prospectErrors } = await client.models.Prospect.create({
    id: prospectId,
    name,
    email,
    phone,
    eventId: '',
    source: 'Booth',
    need: NEEDS[0],
    agent: '',
    stage: 'NEW',
    plan: 'Not decided yet',
    lastContact: savedAt.slice(0, 10),
    notes: `Financial needs analysis at ${booth.name}.`,
    kind: 'Prospect',
  });
  if (prospectErrors?.length) {
    console.error('Prospect create failed', prospectErrors);
    throw new Error('We could not save your details — please try again.');
  }
  const id = randomUUID();
  const { errors } = await client.models.BoothEntry.create({ id, boothId: booth.id, prospectId, name, email, phone, analysis, savedAt });
  if (errors?.length) {
    console.error('BoothEntry create failed', errors);
    throw new Error('We could not save your details — please try again.');
  }
  return id;
}

// Amplify's function resolver passes the operation name as a top-level
// `fieldName` (there is no AppSync-style `info` object on this event).
export const handler = async (event: { fieldName: string; arguments: Record<string, unknown> }) => {
  switch (event.fieldName) {
    case 'getPublicEvent': return getPublicEvent(event.arguments);
    case 'registerForEvent': return registerForEvent(event.arguments);
    case 'getPublicBooth': return getPublicBooth(event.arguments);
    case 'saveBoothAnalysis': return saveBoothAnalysis(event.arguments);
    default: throw new Error('Unsupported operation.');
  }
};
