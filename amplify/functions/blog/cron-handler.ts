import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/blog-cron';
import type { Schema } from '../../data/resource';
import { generateTopic, generateTopics, slugify, writeArticle } from './article-writer';
import { TOPICS } from './topics';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const MAX_ATTEMPTS = 3;
// How many topics go into the dashboard queue when it runs dry. Matches
// SUGGEST_BATCH in src/app/dashboard/screens/BlogScreen.tsx.
const QUEUE_REFILL = 12;

// Every article ever written, including soft-deleted ones: a slug is never
// reused, and a deleted topic is not written again. A failed read throws —
// treating it as "nothing published yet" would start repeating topics.
async function loadExisting() {
  const rows: { slug: string; title: string; topic?: string | null }[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Article.list({ limit: 1000, nextToken, selectionSet: ['slug', 'title', 'topic'] });
    if (res.errors?.length) throw new Error('Could not load existing articles: ' + res.errors.map(e => e.message).join('; '));
    rows.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  return rows;
}

// Topics waiting on the dashboard's Queue tab. Those are for a person to
// write and review, so the daily article leaves them alone.
async function loadQueue() {
  const rows: { title: string }[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.ArticleQueue.list({ limit: 1000, nextToken, selectionSet: ['title'] });
    if (res.errors?.length) throw new Error('Could not load the queue: ' + res.errors.map(e => e.message).join('; '));
    rows.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  return rows;
}

// Once the queue has been worked through, top it back up: first from the
// site-based list, then with new topics from the AI once that list is used
// up. Returns the titles it queued.
async function refillQueue(used: Set<string>, slugs: Set<string>, usedTitles: string[]) {
  const picked: { title: string; category: string }[] = TOPICS
    .filter(t => !used.has(t.title.toLowerCase()) && !slugs.has(slugify(t.title)))
    .slice(0, QUEUE_REFILL);
  if (picked.length < QUEUE_REFILL) {
    const fresh = await generateTopics([...usedTitles, ...picked.map(t => t.title)], QUEUE_REFILL - picked.length);
    const taken = new Set(picked.map(t => t.title.toLowerCase()));
    for (const t of fresh) {
      const key = t.title.toLowerCase();
      if (used.has(key) || taken.has(key) || slugs.has(slugify(t.title))) continue;
      taken.add(key);
      picked.push(t);
    }
  }

  const queued: string[] = [];
  for (const [position, t] of picked.entries()) {
    const { errors } = await client.models.ArticleQueue.create({ title: t.title, category: t.category, position });
    if (errors?.length) console.error('Could not queue topic', t.title, errors);
    else queued.push(t.title);
  }
  console.log(`Queue was empty: added ${queued.length} topics`);
  return queued;
}

export const handler = async () => {
  const existing = await loadExisting();
  const slugs = new Set(existing.map(a => a.slug));
  const usedTitles = existing.map(a => a.title);
  const used = new Set(existing.flatMap(a => [a.title, a.topic ?? '']).map(t => t.toLowerCase()));
  const tried = new Set<string>();

  // The queue is a convenience; a problem with it must never stop the
  // day's article from being written.
  let queuedTitles: string[] = [];
  try {
    queuedTitles = (await loadQueue()).map(q => q.title);
    if (!queuedTitles.length) queuedTitles = await refillQueue(used, slugs, usedTitles);
  } catch (err) {
    console.error('Queue top-up failed', err);
  }
  const queued = new Set(queuedTitles.map(t => t.toLowerCase()));

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const unused = TOPICS.filter(t => !used.has(t.title.toLowerCase()) && !queued.has(t.title.toLowerCase()) && !slugs.has(slugify(t.title)) && !tried.has(t.title));
    const topic = unused.length
      ? unused[Math.floor(Math.random() * unused.length)]
      : await generateTopic([...usedTitles, ...queuedTitles, ...tried]);
    tried.add(topic.title);

    const article = await writeArticle({ topic: topic.title, category: topic.category, keywords: topic.keywords });
    if (slugs.has(article.slug)) {
      console.warn(`Slug "${article.slug}" already exists (attempt ${attempt}), trying another topic`);
      continue;
    }

    const { errors } = await client.models.Article.create({
      slug: article.slug,
      title: article.title,
      topic: topic.title,
      category: topic.category,
      excerpt: article.excerpt,
      content: article.content,
      readTime: article.read_time,
      imageUrl: article.image_url,
      publishedAt: new Date().toISOString(),
    });
    if (errors?.length) throw new Error('Could not save the article: ' + errors.map(e => e.message).join('; '));

    console.log(`Published "${article.title}" at /blog/${article.slug}`);
    return { statusText: 'published', slug: article.slug };
  }

  throw new Error(`No article published: every attempt produced a slug that already exists (${MAX_ATTEMPTS} tries).`);
};
