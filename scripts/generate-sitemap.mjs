// Writes dist/sitemap.xml after `vite build`: the site's public pages plus
// every live blog article, read from the same public API the blog uses.
//
// The article list is only as fresh as the last build, so an article
// published since then is missing until the next deploy. Search engines
// still find it through the links on /blog.
//
// Never fails the build: if the articles can't be read, the sitemap is
// written with the static pages only.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const SITE_URL = (process.env.VITE_SITE_URL || 'https://www.corementra.com').replace(/\/+$/, '');

const PAGES = [
  '/',
  '/who-am-i',
  '/services',
  '/professional-careers',
  '/estate-planning',
  '/retirement-planning',
  '/hnwi-estate-planning',
  '/life-insurance',
  '/faq',
  '/blog',
  '/contact',
];

async function loadArticles() {
  if (!existsSync('amplify_outputs.json')) return [];
  const { data } = JSON.parse(readFileSync('amplify_outputs.json', 'utf8'));
  if (!data?.url || !data?.api_key) return [];
  const res = await fetch(data.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': data.api_key },
    body: JSON.stringify({ query: '{ listPublicArticles { slug publishedAt } }' }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data?.listPublicArticles ?? [];
}

const escapeXml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let articles = [];
try {
  articles = await loadArticles();
} catch (err) {
  console.warn('sitemap: could not load articles, writing static pages only —', err.message);
}

const entries = [
  ...PAGES.map(path => ({ loc: SITE_URL + path })),
  ...articles.map(a => ({ loc: `${SITE_URL}/blog/${a.slug}`, lastmod: (a.publishedAt || '').slice(0, 10) })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url><loc>${escapeXml(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;

writeFileSync('dist/sitemap.xml', xml);
console.log(`sitemap: ${PAGES.length} pages + ${articles.length} articles -> dist/sitemap.xml`);
