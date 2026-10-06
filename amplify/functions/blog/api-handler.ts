import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/blog-api';
import type { Schema } from '../../data/resource';
import { CATEGORIES } from './article-writer';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MAX = 80;
const TITLE_MAX = 200;
const EXCERPT_MAX = 500;
// A DynamoDB item tops out at 400 KB; a 1,400-word article is about 10 KB.
const CONTENT_MAX = 100_000;
// Cover photos only ever come from Pexels (see findCoverImage), which is
// also the only image host the site's CSP allows.
const IMAGE_RE = /^https:\/\/images\.pexels\.com\/[^\s"'<>]+$/;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function failed(errors: { message: string }[] | undefined, what: string): never | void {
  if (errors?.length) {
    console.error(what, errors);
    throw new Error(what + ': ' + errors.map(e => e.message).join('; '));
  }
}

// ---- Public (API key) ----------------------------------------------------

// The public blog's whole view of an article: nothing soft-deleted, and
// never the internal `topic` field.
async function listPublicArticles() {
  const rows: Schema['Article']['type'][] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Article.list({
      filter: { deletedAt: { attributeExists: false } },
      limit: 1000,
      nextToken,
    });
    failed(res.errors, 'Could not load articles');
    rows.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);

  return rows
    .filter(a => !a.deletedAt)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .map(a => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      excerpt: a.excerpt,
      readTime: a.readTime,
      imageUrl: a.imageUrl,
      publishedAt: a.publishedAt,
    }));
}

async function getPublicArticle(args: Record<string, unknown>) {
  const slug = str(args.slug);
  if (slug.length > SLUG_MAX || !SLUG_RE.test(slug)) return null;
  const { data: a } = await client.models.Article.get({ slug });
  if (!a || a.deletedAt) return null;
  return {
    slug: a.slug,
    title: a.title,
    category: a.category,
    excerpt: a.excerpt,
    content: a.content,
    readTime: a.readTime,
    imageUrl: a.imageUrl,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
  };
}

// ---- Admin (signed-in Cognito user) --------------------------------------

async function publishArticle(args: Record<string, unknown>) {
  const title = str(args.title);
  const slug = str(args.slug);
  const category = str(args.category);
  const excerpt = str(args.excerpt);
  const content = str(args.content);
  const imageUrl = str(args.imageUrl);
  const minutes = parseInt(str(args.readTime), 10);

  if (!title || title.length > TITLE_MAX) throw new Error('The article needs a title.');
  if (slug.length > SLUG_MAX || !SLUG_RE.test(slug)) throw new Error('The article address (slug) is not valid.');
  if (!(CATEGORIES as readonly string[]).includes(category)) throw new Error('Pick a category from the list.');
  if (excerpt.length > EXCERPT_MAX) throw new Error('The excerpt is too long.');
  if (!content || content.length > CONTENT_MAX) throw new Error('The article has no content, or is too long.');
  if (imageUrl && !IMAGE_RE.test(imageUrl)) throw new Error('The cover image address is not valid.');

  // slug is the table's key, so create() fails rather than overwrites when
  // one is already taken — including by a soft-deleted article.
  const { data: taken } = await client.models.Article.get({ slug });
  if (taken) {
    throw new Error(taken.deletedAt
      ? 'A deleted article already uses this address. Restore it or delete it forever first.'
      : 'An article with this address is already published.');
  }

  const { errors } = await client.models.Article.create({
    slug,
    title,
    topic: str(args.topic) || title,
    category,
    excerpt,
    content,
    readTime: `${Number.isFinite(minutes) && minutes > 0 ? minutes : 1} min read`,
    imageUrl,
    publishedAt: new Date().toISOString(),
  });
  failed(errors, 'Could not publish the article');
  return slug;
}

async function removeArticle(args: Record<string, unknown>) {
  const slug = str(args.slug);
  const { data: article } = await client.models.Article.get({ slug });
  if (!article) throw new Error('That article no longer exists.');

  if (args.permanent === true) {
    // Only reachable from Recently Deleted: a live article has to be
    // soft-deleted first.
    if (!article.deletedAt) throw new Error('Only an article in Recently Deleted can be deleted forever.');
    const { errors } = await client.models.Article.delete({ slug });
    failed(errors, 'Could not delete the article');
    return true;
  }

  const { errors } = await client.models.Article.update({ slug, deletedAt: new Date().toISOString() });
  failed(errors, 'Could not delete the article');
  return true;
}

async function restoreArticle(args: Record<string, unknown>) {
  const slug = str(args.slug);
  const { data: article } = await client.models.Article.get({ slug });
  if (!article) throw new Error('That article no longer exists.');
  const { errors } = await client.models.Article.update({ slug, deletedAt: null });
  failed(errors, 'Could not restore the article');
  return true;
}

// Amplify's function resolver passes the operation name as a top-level
// `fieldName` (there is no AppSync-style `info` object on this event).
export const handler = async (event: { fieldName: string; arguments: Record<string, unknown> }) => {
  switch (event.fieldName) {
    case 'listPublicArticles': return listPublicArticles();
    case 'getPublicArticle': return getPublicArticle(event.arguments);
    case 'publishArticle': return publishArticle(event.arguments);
    case 'removeArticle': return removeArticle(event.arguments);
    case 'restoreArticle': return restoreArticle(event.arguments);
    default: throw new Error('Unsupported operation.');
  }
};
