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
const NEEDS = ['Not captured yet', 'Estate Planning', 'Life Insurance', 'Health / Disability', 'Family Protection', 'College', 'Retirement', 'Tax-Free Income', 'IRA / 401(k)', 'Risk Protection'];

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

async function findEvent(id: string) {
  if (!ID_RE.test(id)) return null;
  const { data } = await client.models.Event.get({ id });
  return data ?? null;
}

async function getPublicEvent(args: Record<string, unknown>) {
  const event = await findEvent(str(args.id));
  // Only what the registration page shows — never expense or attendance.
  return event ? { id: event.id, name: event.name } : null;
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

// Amplify's function resolver passes the operation name as a top-level
// `fieldName` (there is no AppSync-style `info` object on this event).
export const handler = async (event: { fieldName: string; arguments: Record<string, unknown> }) => {
  switch (event.fieldName) {
    case 'getPublicEvent': return getPublicEvent(event.arguments);
    case 'registerForEvent': return registerForEvent(event.arguments);
    default: throw new Error('Unsupported operation.');
  }
};
