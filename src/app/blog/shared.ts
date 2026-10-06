import { useEffect } from "react";
import { client } from "../dashboard/client";

export const SITE_NAME = "CoreMentra";

// Every absolute URL (canonical, OpenGraph, JSON-LD, share links) is built
// from this. Set VITE_SITE_URL to the host the site doesn't redirect away
// from (e.g. the www one); without it the current origin is used.
export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/+$/, "");

// Mirrors CATEGORIES in amplify/functions/blog/article-writer.ts.
export const BLOG_CATEGORIES = [
  "Life Insurance",
  "Retirement Planning",
  "Estate Planning",
  "High Net Worth",
  "Financial Basics",
  "Professional Careers",
];

export interface ArticleSummary {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  imageUrl: string;
  publishedAt: string;
}

export interface Article extends ArticleSummary {
  content: string;
  updatedAt: string;
}

// The list is shared by /blog and every article page (for related
// articles), so it's fetched once and reused for five minutes.
const LIST_TTL_MS = 5 * 60 * 1000;
let listCache: { at: number; promise: Promise<ArticleSummary[]> } | null = null;

export function getArticles(): Promise<ArticleSummary[]> {
  if (listCache && Date.now() - listCache.at < LIST_TTL_MS) return listCache.promise;
  const promise = client.queries.listPublicArticles({ authMode: "apiKey" }).then(res => {
    if (res.errors?.length) throw new Error(res.errors[0].message);
    return (res.data ?? []).filter(a => a != null).map(a => ({
      slug: a.slug,
      title: a.title,
      category: a.category || "General",
      excerpt: a.excerpt || "",
      readTime: a.readTime || "1 min read",
      imageUrl: a.imageUrl || "",
      publishedAt: a.publishedAt || "",
    }));
  });
  listCache = { at: Date.now(), promise };
  // A failed load shouldn't be remembered for five minutes.
  promise.catch(() => { if (listCache?.promise === promise) listCache = null; });
  return promise;
}

export async function getArticle(slug: string): Promise<Article | null> {
  const res = await client.queries.getPublicArticle({ slug }, { authMode: "apiKey" });
  if (res.errors?.length) throw new Error(res.errors[0].message);
  const a = res.data;
  if (!a) return null;
  return {
    slug: a.slug,
    title: a.title,
    category: a.category || "General",
    excerpt: a.excerpt || "",
    content: a.content,
    readTime: a.readTime || "1 min read",
    imageUrl: a.imageUrl || "",
    publishedAt: a.publishedAt || "",
    updatedAt: a.updatedAt || a.publishedAt || "",
  };
}

export async function getRelatedArticles(category: string, slug: string): Promise<ArticleSummary[]> {
  const all = await getArticles();
  return all.filter(a => a.category === category && a.slug !== slug).slice(0, 3);
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Pulls the question/answer pairs out of an article's closing "## FAQ"
// section (### per question), for the FAQPage structured data.
export function extractFaq(markdown: string): { question: string; answer: string }[] {
  const lines = markdown.split("\n");
  const start = lines.findIndex(l => /^##\s+FAQ\b/i.test(l.trim()));
  if (start === -1) return [];
  const faq: { question: string; answer: string }[] = [];
  let question = "";
  let answer: string[] = [];
  const flush = () => {
    const text = answer.join(" ").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim();
    if (question && text) faq.push({ question, answer: text });
  };
  for (const raw of lines.slice(start + 1)) {
    const line = raw.trim();
    if (/^##\s/.test(line)) break;
    if (/^###\s/.test(line)) {
      flush();
      question = line.replace(/^###\s+/, "").replace(/[*_`]/g, "").trim();
      answer = [];
    } else if (line) {
      answer.push(line);
    }
  }
  flush();
  return faq;
}

// "<", ">" and "&" are escaped so article text can never close the script
// element the JSON sits in.
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export interface Seo {
  title: string;
  description: string;
  canonical: string;
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  jsonLd?: unknown[];
}

// This is a client-rendered app, so a page's <head> is managed here: the
// tags are added while the page is mounted and removed again when it isn't.
export function useSeo(seo: Seo | null) {
  const key = seo ? JSON.stringify(seo) : "";
  useEffect(() => {
    if (!seo) return;
    const previousTitle = document.title;
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null;
    const added: Element[] = [];
    const add = (tag: string, attrs: Record<string, string>, text?: string) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      if (text) el.textContent = text;
      document.head.appendChild(el);
      added.push(el);
    };

    document.title = seo.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", seo.description);
    add("link", { rel: "canonical", href: seo.canonical });
    add("meta", { property: "og:type", content: seo.type ?? "website" });
    add("meta", { property: "og:title", content: seo.title });
    add("meta", { property: "og:description", content: seo.description });
    add("meta", { property: "og:url", content: seo.canonical });
    add("meta", { property: "og:site_name", content: SITE_NAME });
    if (seo.image) add("meta", { property: "og:image", content: seo.image });
    if (seo.publishedTime) add("meta", { property: "article:published_time", content: seo.publishedTime });
    if (seo.modifiedTime) add("meta", { property: "article:modified_time", content: seo.modifiedTime });
    (seo.jsonLd ?? []).forEach(data => add("script", { type: "application/ld+json" }, serializeJsonLd(data)));

    return () => {
      added.forEach(el => el.remove());
      document.title = previousTitle;
      if (previousDescription !== null) document.querySelector('meta[name="description"]')?.setAttribute("content", previousDescription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
