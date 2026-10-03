import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { SESv2Client } from '@aws-sdk/client-sesv2';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import nodemailer from 'nodemailer';
import { env } from '$amplify/env/send-occasion-emails';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const ses = new SESv2Client();
const s3 = new S3Client();
const transporter = nodemailer.createTransport({
  SES: { sesClient: ses, SendEmailCommand: (await import('@aws-sdk/client-sesv2')).SendEmailCommand },
});

type Occasion = 'Birthday' | 'Anniversary';

function todayMonthDay() {
  const now = new Date();
  return { month: now.getUTCMonth() + 1, day: now.getUTCDate(), year: now.getUTCFullYear() };
}

function matchesMonthDay(dateStr: string | null | undefined, month: number, day: number) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCMonth() + 1 === month && d.getUTCDate() === day;
}

function yearsSince(dateStr: string, year: number) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return year - d.getUTCFullYear();
}

// A filtered list() only filters the page it scanned, so this has to walk
// every page — otherwise a matching log row past the first page is missed
// and the same person is emailed again on a retry.
async function alreadySent(recipientId: string, occasion: Occasion, year: number) {
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.EmailLog.list({
      filter: { recipientId: { eq: recipientId }, occasion: { eq: occasion }, status: { eq: 'Sent' } },
      limit: 1000,
      nextToken,
    });
    if (res.data.some(l => l.sentAt && new Date(l.sentAt).getUTCFullYear() === year)) return true;
    nextToken = res.nextToken;
  } while (nextToken);
  return false;
}

// What gets merged into {{name}}: one line, no control characters, capped.
function mergeName(name: string) {
  return name.replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

const EMAIL_RE = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

async function fetchFlyer(flyerKey: string | null | undefined) {
  if (!flyerKey) return null;
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: env.FLYER_BUCKET_NAME, Key: flyerKey }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) return null;
    return { filename: flyerKey.split('/').pop() || 'flyer.jpg', content: Buffer.from(bytes) };
  } catch (err) {
    console.error('Could not fetch flyer', flyerKey, err);
    return null;
  }
}

async function send(
  template: { subject?: string | null; body?: string | null; flyerKey?: string | null },
  recipient: { id: string; type: 'Client' | 'Prospect'; name: string; email: string },
  occasion: Occasion,
  mergeVars: Record<string, string>,
) {
  const subject = Object.entries(mergeVars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), template.subject || '');
  const body = Object.entries(mergeVars).reduce((b, [k, v]) => b.replaceAll(`{{${k}}}`, v), template.body || '');
  const flyer = await fetchFlyer(template.flyerKey);

  try {
    await transporter.sendMail({
      from: env.SES_FROM_ADDRESS,
      to: recipient.email,
      subject,
      text: body,
      attachments: flyer ? [flyer] : [],
    });
    await client.models.EmailLog.create({
      recipientType: recipient.type, recipientId: recipient.id, recipientEmail: recipient.email,
      recipientName: recipient.name, occasion, sentAt: new Date().toISOString(), status: 'Sent',
    });
    console.log(`Sent ${occasion} email to ${recipient.email}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await client.models.EmailLog.create({
      recipientType: recipient.type, recipientId: recipient.id, recipientEmail: recipient.email,
      recipientName: recipient.name, occasion, sentAt: new Date().toISOString(), status: 'Failed', errorMessage,
    });
    console.error(`Failed to send ${occasion} email to ${recipient.email}`, err);
  }
}

export const handler = async () => {
  const { month, day, year } = todayMonthDay();

  const { data: templates } = await client.models.EmailTemplate.list();
  const birthdayTemplate = templates.find(t => t.occasion === 'Birthday' && t.active);
  const anniversaryTemplate = templates.find(t => t.occasion === 'Anniversary' && t.active);

  const listAll = async <T,>(model: { list: (args?: any) => Promise<{ data: T[]; nextToken?: string | null }> }) => {
    let items: T[] = [];
    let nextToken: string | null | undefined;
    do {
      const res = await model.list({ nextToken, limit: 1000 });
      items = items.concat(res.data);
      nextToken = res.nextToken;
    } while (nextToken);
    return items;
  };

  if (birthdayTemplate) {
    const clients = await listAll(client.models.Client as any) as Array<{ id: string; name: string; email?: string | null; birthday?: string | null }>;
    const prospects = await listAll(client.models.Prospect as any) as Array<{ id: string; name: string; email?: string | null; birthday?: string | null }>;
    for (const c of [...clients.map(c => ({ ...c, type: 'Client' as const })), ...prospects.map(p => ({ ...p, type: 'Prospect' as const }))]) {
      if (!c.email || !EMAIL_RE.test(c.email) || !matchesMonthDay(c.birthday, month, day)) continue;
      if (await alreadySent(c.id, 'Birthday', year)) continue;
      await send(birthdayTemplate, { id: c.id, type: c.type, name: c.name, email: c.email }, 'Birthday', { name: mergeName(c.name) });
    }
  }

  if (anniversaryTemplate) {
    const clients = await listAll(client.models.Client as any) as Array<{ id: string; name: string; email?: string | null; since?: string | null }>;
    for (const c of clients) {
      if (!c.email || !EMAIL_RE.test(c.email) || !c.since || !matchesMonthDay(c.since, month, day)) continue;
      const years = yearsSince(c.since, year);
      if (years < 1) continue;
      if (await alreadySent(c.id, 'Anniversary', year)) continue;
      await send(anniversaryTemplate, { id: c.id, type: 'Client', name: c.name, email: c.email }, 'Anniversary', { name: mergeName(c.name), years: String(years) });
    }
  }

  return { statusText: 'done' };
};
