import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/blog-writer';
import type { Schema } from '../../data/resource';
import { CATEGORIES, writeArticle } from './article-writer';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const JOB_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;
const TOPIC_MAX = 200;

async function saveDraft(id: string, fields: { status: 'ready' | 'error'; topic: string; category: string; payload?: string; error?: string }) {
  const { errors } = await client.models.ArticleDraft.create({ id, ...fields });
  if (errors?.length) console.error('Could not save draft', id, errors);
}

// Invoked asynchronously, and Lambda re-runs an async invocation that
// throws — which here would mean paying to write the same article up to
// three times. So this never throws: a failure is recorded on the draft row,
// where the dashboard shows it.
export const handler = async (event: { arguments: Record<string, unknown> }) => {
  const jobId = typeof event.arguments?.jobId === 'string' ? event.arguments.jobId : '';
  const topic = typeof event.arguments?.topic === 'string' ? event.arguments.topic.trim() : '';
  const category = typeof event.arguments?.category === 'string' ? event.arguments.category : '';
  if (!JOB_ID_RE.test(jobId)) {
    console.error('Ignoring draft request with an invalid job id');
    return;
  }

  try {
    if (!topic || topic.length > TOPIC_MAX) throw new Error(`Enter a topic of up to ${TOPIC_MAX} characters.`);
    if (!(CATEGORIES as readonly string[]).includes(category)) throw new Error('Pick a category from the list.');
    const draft = await writeArticle({ topic, category });
    await saveDraft(jobId, { status: 'ready', topic, category, payload: JSON.stringify(draft) });
  } catch (err) {
    console.error('Draft generation failed', err);
    const message = err instanceof Error ? err.message : 'Something went wrong while writing the draft.';
    await saveDraft(jobId, { status: 'error', topic, category, error: message.slice(0, 500) }).catch(e => console.error(e));
  }
};
