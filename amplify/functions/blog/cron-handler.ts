import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/blog-cron';
import type { Schema } from '../../data/resource';
import { generateTopic, slugify, writeArticle } from './article-writer';
import { TOPICS } from './topics';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const MAX_ATTEMPTS = 3;

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

export const handler = async () => {
  const existing = await loadExisting();
  const slugs = new Set(existing.map(a => a.slug));
  const usedTitles = existing.map(a => a.title);
  const used = new Set(existing.flatMap(a => [a.title, a.topic ?? '']).map(t => t.toLowerCase()));
  const tried = new Set<string>();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const unused = TOPICS.filter(t => !used.has(t.title.toLowerCase()) && !slugs.has(slugify(t.title)) && !tried.has(t.title));
    const topic = unused.length
      ? unused[Math.floor(Math.random() * unused.length)]
      : await generateTopic([...usedTitles, ...tried]);
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
