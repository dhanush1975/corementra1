import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { DecryptCommand, GenerateDataKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$amplify/env/applications';
import type { Schema } from '../../data/resource';
import {
  DOC_SLOTS, blankQuestionnaire, cleanQuestionnaire, docPathOk, docPaths, type Questionnaire,
} from '../../../src/app/dashboard/applications/questionnaire';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const KEY_ARN = process.env.APPLICATION_KEY_ARN!;
const BUCKET = process.env.DOCS_BUCKET_NAME!;
const FROM_ADDRESS = 'contact@corementra.com';
const kms = new KMSClient({});
const ses = new SESv2Client({});
const s3 = new S3Client({});

// Who can do what is enforced by AppSync per operation (data/resource.ts):
// the get/upload/submit "Public" operations take the API key, everything
// else needs the signed-in dashboard.
const STATUS_OPEN = 'Awaiting client';
const STATUS_DONE = 'Submitted';
const STATUSES = [STATUS_OPEN, STATUS_DONE];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{32}$/;
const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]{0,79}$/u;
const EMAIL_RE = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/;
const PHONE_RE = /^[+(]?[0-9][0-9 ().-]{5,24}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATA_MAX = 100_000;
const UPLOAD_MAX = 10 * 1024 * 1024;
const UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const LINK_SECONDS = 300;
// How long a client link stays usable; after that the agent resends it,
// which makes a new link and retires the old one.
const LINK_HOURS = 24;
// Where a link may point: the live site, Amplify preview builds, and local
// dev. The dashboard passes its own origin.
const ORIGIN_RE = /^(https:\/\/(www\.)?corementra\.com|https:\/\/[a-z0-9.-]+\.amplifyapp\.com|http:\/\/localhost:\d{2,5})$/;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const newToken = () => randomBytes(24).toString('base64url');
const expiryFromNow = () => new Date(Date.now() + LINK_HOURS * 3600_000).toISOString();
// A link with no expiry on record counts as expired.
const linkExpired = (app: { linkExpiresAt?: string | null }) => !app.linkExpiresAt || Date.parse(app.linkExpiresAt) <= Date.now();
const EXPIRED_MSG = 'This link has expired. Please ask your agent to send you a new one.';
const prefixOf = (id: string) => `applications/${id}/`;

// ---- Encryption ----------------------------------------------------------
// Envelope encryption: KMS makes a fresh AES-256 key per save, the
// questionnaire is encrypted with it (AES-GCM), and only the KMS-encrypted
// copy of that key is stored next to it. The application id is bound in as
// KMS encryption context and GCM associated data, so a stored value can't
// be copied onto another application and decrypted there.

interface Sealed { v: 1; k: string; iv: string; tag: string; ct: string }

async function seal(id: string, plaintext: string): Promise<string> {
  const { Plaintext, CiphertextBlob } = await kms.send(new GenerateDataKeyCommand({
    KeyId: KEY_ARN, KeySpec: 'AES_256', EncryptionContext: { application: id },
  }));
  if (!Plaintext || !CiphertextBlob) throw new Error('Encryption key unavailable');
  const dataKey = Buffer.from(Plaintext);
  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
    cipher.setAAD(Buffer.from(id));
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const sealed: Sealed = {
      v: 1,
      k: Buffer.from(CiphertextBlob).toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      ct: ct.toString('base64'),
    };
    return JSON.stringify(sealed);
  } finally {
    dataKey.fill(0);
    Plaintext.fill(0);
  }
}

async function unseal(id: string, stored: string): Promise<string> {
  const s = JSON.parse(stored) as Sealed;
  if (s.v !== 1) throw new Error('Unknown encryption version');
  const { Plaintext } = await kms.send(new DecryptCommand({
    KeyId: KEY_ARN, CiphertextBlob: Buffer.from(s.k, 'base64'), EncryptionContext: { application: id },
  }));
  if (!Plaintext) throw new Error('Encryption key unavailable');
  const dataKey = Buffer.from(Plaintext);
  try {
    const decipher = createDecipheriv('aes-256-gcm', dataKey, Buffer.from(s.iv, 'base64'));
    decipher.setAAD(Buffer.from(id));
    decipher.setAuthTag(Buffer.from(s.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(s.ct, 'base64')), decipher.final()]).toString('utf8');
  } finally {
    dataKey.fill(0);
    Plaintext.fill(0);
  }
}

// ---- Lookups -------------------------------------------------------------

async function byId(id: string) {
  if (!UUID_RE.test(id)) throw new Error('Questionnaire not found.');
  const { data } = await client.models.Application.get({ id });
  if (!data) throw new Error('Questionnaire not found.');
  return data;
}

async function byToken(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const { data } = await client.models.Application.listApplicationByToken({ token });
  return data?.[0] ?? null;
}

function parseData(raw: string, id: string): Questionnaire {
  if (raw.length > DATA_MAX) throw new Error('This questionnaire is too large to save.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('This questionnaire could not be read.'); }
  return cleanQuestionnaire(parsed, prefixOf(id));
}

// Deletes everything in the application's folder that `keep` doesn't list:
// replaced or removed uploads, or (with an empty keep) all of them.
async function pruneDocs(id: string, keep: string[]) {
  const keepSet = new Set(keep);
  let token: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefixOf(id), ContinuationToken: token }));
    const stale = (res.Contents ?? []).map(o => o.Key!).filter(k => k && !keepSet.has(k));
    if (stale.length) await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: stale.map(Key => ({ Key })), Quiet: true } }));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
}

async function uploadTicket(id: string, args: Record<string, unknown>) {
  const who = str(args.who);
  const slot = str(args.slot);
  const contentType = str(args.contentType).toLowerCase();
  const size = Number(args.size);
  if (who !== 'primary' && who !== 'spouse') throw new Error('Unknown applicant.');
  if (!DOC_SLOTS.some(s => s.key === slot)) throw new Error('Unknown document.');
  if (!UPLOAD_TYPES.includes(contentType)) throw new Error('Please upload a PDF or a photo (JPG, PNG, HEIC).');
  if (!Number.isFinite(size) || size <= 0 || size > UPLOAD_MAX) throw new Error('Files must be under 10 MB.');
  const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'image/heif': 'heif', 'image/webp': 'webp' }[contentType];
  // The stored name is ours; the client's file name is kept only inside the
  // encrypted questionnaire.
  const path = `${prefixOf(id)}${who}-${slot}-${randomUUID()}.${ext}`;
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: path,
    Expires: LINK_SECONDS,
    Fields: {
      'Content-Type': contentType,
      'x-amz-server-side-encryption': 'aws:kms',
      'x-amz-server-side-encryption-aws-kms-key-id': KEY_ARN,
    },
    Conditions: [['content-length-range', 1, UPLOAD_MAX]],
  });
  return { url, path, fields: JSON.stringify(fields) };
}

// ---- Public (the link sent to the client) -------------------------------

async function getPublicApplication(args: Record<string, unknown>) {
  const app = await byToken(str(args.token));
  if (!app) return null;
  const status = app.status !== STATUS_OPEN ? 'submitted' : linkExpired(app) ? 'expired' : 'open';
  return { name: app.name, status };
}

async function publicApplicationUpload(args: Record<string, unknown>) {
  const app = await byToken(str(args.token));
  if (!app) throw new Error('This questionnaire link is not valid.');
  if (app.status !== STATUS_OPEN) throw new Error('This questionnaire has already been submitted.');
  if (linkExpired(app)) throw new Error(EXPIRED_MSG);
  return uploadTicket(app.id, args);
}

async function submitApplication(args: Record<string, unknown>) {
  const app = await byToken(str(args.token));
  if (!app) throw new Error('This questionnaire link is not valid.');
  if (app.status !== STATUS_OPEN) throw new Error('This questionnaire has already been submitted.');
  if (linkExpired(app)) throw new Error(EXPIRED_MSG);

  const q = parseData(str(args.data), app.id);
  const p = q.primary.person;
  const name = p.fullName.replace(/\s+/g, ' ');
  if (!NAME_RE.test(name)) throw new Error('Please enter your full name as per your ID.');
  if (!DATE_RE.test(p.dob)) throw new Error('Please enter your date of birth.');
  if (!PHONE_RE.test(p.phone)) throw new Error('Please enter a valid phone number.');
  if (p.email.length > 254 || !EMAIL_RE.test(p.email)) throw new Error('Please enter a valid email address.');

  const { errors } = await client.models.Application.update({
    id: app.id,
    name,
    status: STATUS_DONE,
    submittedAt: new Date().toISOString(),
    secret: await seal(app.id, JSON.stringify(q)),
  });
  if (errors?.length) {
    console.error('Application submit failed', errors.map(e => e.message));
    throw new Error('We could not save your questionnaire — please try again.');
  }
  await pruneDocs(app.id, docPaths(q)).catch(err => console.error('Pruning documents failed', err));
  return true;
}

// ---- Dashboard (signed in) -----------------------------------------------

async function createApplication(args: Record<string, unknown>) {
  const name = str(args.name).replace(/\s+/g, ' ').slice(0, 80) || 'New client';
  const clientId = str(args.clientId).slice(0, 64);
  const id = randomUUID();
  const { errors } = await client.models.Application.create({
    id,
    name,
    clientId: clientId || null,
    status: STATUS_OPEN,
    token: newToken(),
    linkExpiresAt: expiryFromNow(),
    secret: await seal(id, JSON.stringify(blankQuestionnaire())),
  });
  if (errors?.length) {
    console.error('Application create failed', errors.map(e => e.message));
    throw new Error('The questionnaire could not be created.');
  }
  return id;
}

async function openApplication(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  const plain = app.secret ? await unseal(app.id, app.secret) : JSON.stringify(blankQuestionnaire());
  // Re-cleaned on the way out too, so the dashboard always gets the
  // current shape.
  return JSON.stringify(cleanQuestionnaire(JSON.parse(plain), prefixOf(app.id)));
}

async function saveApplication(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  const q = parseData(str(args.data), app.id);
  const status = STATUSES.includes(str(args.status)) ? str(args.status) : app.status;
  const fullName = q.primary.person.fullName.replace(/\s+/g, ' ').slice(0, 80);
  const { errors } = await client.models.Application.update({
    id: app.id,
    name: fullName || app.name,
    clientId: str(args.clientId).slice(0, 64) || null,
    status,
    secret: await seal(app.id, JSON.stringify(q)),
  });
  if (errors?.length) {
    console.error('Application save failed', errors.map(e => e.message));
    throw new Error('The questionnaire could not be saved.');
  }
  await pruneDocs(app.id, docPaths(q)).catch(err => console.error('Pruning documents failed', err));
  return true;
}

async function applicationUpload(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  return uploadTicket(app.id, args);
}

async function applicationDocUrl(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  const path = str(args.path);
  if (!docPathOk(path, prefixOf(app.id))) throw new Error('Document not found.');
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: path }), { expiresIn: LINK_SECONDS });
}

async function linkApplication(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  const { errors } = await client.models.Application.update({ id: app.id, clientId: str(args.clientId).slice(0, 64) || null });
  if (errors?.length) {
    console.error('Application link failed', errors.map(e => e.message));
    throw new Error('The questionnaire could not be linked.');
  }
  return true;
}

// Makes a fresh 24-hour link (the old one stops working at once) and, when
// asked, emails it to the person the questionnaire belongs to.
async function issueApplicationLink(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  if (app.status !== STATUS_OPEN) throw new Error('This questionnaire is already submitted. Set its status back to "Awaiting client" to send a new link.');
  const origin = str(args.origin);
  if (!ORIGIN_RE.test(origin)) throw new Error('Unknown site address.');

  let sentTo: string | null = null;
  let firstName = '';
  if (args.send === true) {
    const person = app.clientId ? (await client.models.Prospect.get({ id: app.clientId })).data : null;
    const email = str(person?.email).toLowerCase();
    if (!person) throw new Error('Link this questionnaire to a person first.');
    if (!EMAIL_RE.test(email)) throw new Error(`Add an email address to ${person.name}'s record first.`);
    sentTo = email;
    firstName = person.name.split(' ')[0] || person.name;
  }

  const token = newToken();
  const expiresAt = expiryFromNow();
  const url = `${origin}/apply/${token}`;
  const { errors } = await client.models.Application.update({
    id: app.id,
    token,
    linkExpiresAt: expiresAt,
    ...(sentTo ? { linkSentAt: new Date().toISOString(), linkSentTo: sentTo } : {}),
  });
  if (errors?.length) {
    console.error('Link update failed', errors.map(e => e.message));
    throw new Error('A new link could not be made.');
  }

  if (sentTo) {
    const text = [
      `Hi ${firstName},`,
      '',
      'Please fill in your client questionnaire for your life insurance application using this secure link:',
      '',
      url,
      '',
      `The link works for ${LINK_HOURS} hours and can be submitted once. Your answers are encrypted and only your agent can see them.`,
      'If it expires before you finish, just reply to this email and I will send you a new one.',
      '',
      'Amit Arakeswara',
      'CoreMentra',
    ].join('\n');
    try {
      await ses.send(new SendEmailCommand({
        FromEmailAddress: FROM_ADDRESS,
        Destination: { ToAddresses: [sentTo] },
        Content: { Simple: { Subject: { Data: 'Your CoreMentra client questionnaire' }, Body: { Text: { Data: text } } } },
      }));
    } catch (err) {
      console.error('Questionnaire email failed', err instanceof Error ? err.message : err);
      throw new Error('The new link was made but the email could not be sent. Copy the link and send it another way.');
    }
  }
  return { url, expiresAt, sentTo };
}

async function deleteApplication(args: Record<string, unknown>) {
  const app = await byId(str(args.id));
  await pruneDocs(app.id, []);
  const { errors } = await client.models.Application.delete({ id: app.id });
  if (errors?.length) {
    console.error('Application delete failed', errors.map(e => e.message));
    throw new Error('The questionnaire could not be deleted.');
  }
  return true;
}

// Nothing here logs the arguments: they carry SSNs and bank numbers.
export const handler = async (event: { fieldName: string; arguments: Record<string, unknown> }) => {
  switch (event.fieldName) {
    case 'getPublicApplication': return getPublicApplication(event.arguments);
    case 'publicApplicationUpload': return publicApplicationUpload(event.arguments);
    case 'submitApplication': return submitApplication(event.arguments);
    case 'createApplication': return createApplication(event.arguments);
    case 'openApplication': return openApplication(event.arguments);
    case 'saveApplication': return saveApplication(event.arguments);
    case 'applicationUpload': return applicationUpload(event.arguments);
    case 'applicationDocUrl': return applicationDocUrl(event.arguments);
    case 'issueApplicationLink': return issueApplicationLink(event.arguments);
    case 'linkApplication': return linkApplication(event.arguments);
    case 'deleteApplication': return deleteApplication(event.arguments);
    default: throw new Error(`Unknown operation ${event.fieldName}`);
  }
};
