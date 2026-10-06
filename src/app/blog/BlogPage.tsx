import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Search } from "lucide-react";
import { Page, Label, SectionHeading, CTABanner, inter } from "../pages/shared";
import { ArticleSummary, SITE_NAME, SITE_URL, formatDate, getArticles, useSeo } from "./shared";

function Cover({ article, className }: { article: ArticleSummary; className: string }) {
  if (!article.imageUrl) {
    return (
      <div className={`${className} bg-[#f5f5f5] flex items-center justify-center`}>
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c4c4c4]">{article.category}</span>
      </div>
    );
  }
  return <img src={article.imageUrl} alt="" loading="lazy" className={`${className} object-cover`} />;
}

function Meta({ article }: { article: ArticleSummary }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#a3a3a3]">
      <span className="font-semibold uppercase tracking-[0.1em] text-[#737373]">{article.category}</span>
      <span>·</span>
      <span>{formatDate(article.publishedAt)}</span>
      <span>·</span>
      <span>{article.readTime}</span>
    </div>
  );
}

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <Link to={`/blog/${article.slug}`} className="group flex flex-col bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm">
      <Cover article={article} className="w-full aspect-[16/9]" />
      <div className="p-6 flex flex-col gap-3 flex-1">
        <Meta article={article} />
        <h3 className="text-base font-bold text-[#0a0a0a] tracking-[-0.01em] leading-snug group-hover:underline underline-offset-2">{article.title}</h3>
        <p className="text-sm text-[#737373] leading-relaxed">{article.excerpt}</p>
      </div>
    </Link>
  );
}

function FeaturedCard({ article }: { article: ArticleSummary }) {
  return (
    <Link to={`/blog/${article.slug}`} className="group flex flex-col bg-[#f5f5f5] border border-[#e5e5e5] rounded-2xl overflow-hidden transition-all duration-200 hover:border-[#d4d4d4] hover:shadow-sm">
      <Cover article={article} className="w-full aspect-[2/1]" />
      <div className="p-7 flex flex-col gap-3 flex-1">
        <Meta article={article} />
        <h2 className="text-2xl font-black text-[#0a0a0a] tracking-[-0.02em] leading-tight group-hover:underline underline-offset-4">{article.title}</h2>
        <p className="text-[15px] text-[#737373] leading-relaxed">{article.excerpt}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a0a0a] mt-auto pt-2">Read article <ArrowRight size={14} /></span>
      </div>
    </Link>
  );
}

export function BlogPage({ navigate }: { navigate: (p: Page) => void }) {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    getArticles().then(setArticles).catch(() => setFailed(true));
  }, []);

  useSeo({
    title: `Blog | ${SITE_NAME}`,
    description: "Plain-English articles on retirement planning, life insurance, estate planning and building wealth.",
    canonical: `${SITE_URL}/blog`,
    jsonLd: articles?.length ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: articles.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/blog/${a.slug}`,
        name: a.title,
      })),
    }] : [],
  });

  // Only categories that actually have an article get a chip.
  const categories = useMemo(() => ["All", ...Array.from(new Set((articles ?? []).map(a => a.category))).sort()], [articles]);

  const filtering = category !== "All" || query.trim() !== "";
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (articles ?? []).filter(a =>
      (category === "All" || a.category === category) &&
      (!q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)));
  }, [articles, category, query]);

  // The two newest lead the page; a search or category filter shows one
  // flat grid instead.
  const featured = filtering ? [] : visible.slice(0, 2);
  const rest = filtering ? visible : visible.slice(2);

  return (
    <div style={{ fontFamily: inter }}>
      <section className="pt-40 pb-20 px-6 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-[1200px] mx-auto">
          <Label>Blog</Label>
          <SectionHeading>Insights</SectionHeading>
          <p className="text-[#737373] text-[15px] mt-4 max-w-2xl">
            Plain-English articles on retirement, life insurance, estate planning and building wealth.
          </p>
        </div>
      </section>

      <section className="py-12 px-6 bg-white">
        <div className="max-w-[1200px] mx-auto">
          {articles === null && !failed && <p className="text-sm text-[#a3a3a3]">Loading articles…</p>}
          {failed && <p className="text-sm text-[#737373]">The articles couldn't be loaded right now. Please refresh the page to try again.</p>}
          {articles?.length === 0 && <p className="text-sm text-[#737373]">The first articles are on their way — check back soon.</p>}

          {articles && articles.length > 0 && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-10">
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${category === c ? "bg-[#0a0a0a] text-white" : "border border-[#e5e5e5] text-[#737373] hover:border-[#0a0a0a] hover:text-[#0a0a0a]"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="relative w-full lg:w-72 shrink-0">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
                  <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search articles"
                    aria-label="Search articles"
                    className="w-full h-10 pl-10 pr-4 rounded-full border border-[#e5e5e5] bg-white text-sm text-[#0a0a0a] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#0a0a0a] transition-colors"
                  />
                </div>
              </div>

              {visible.length === 0 && <p className="text-sm text-[#737373]">No articles match that search.</p>}

              {featured.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {featured.map(a => <FeaturedCard key={a.slug} article={a} />)}
                </div>
              )}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(a => <ArticleCard key={a.slug} article={a} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CTABanner navigate={navigate} />
    </div>
  );
}
