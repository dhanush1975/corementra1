import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, Facebook, Link2, Linkedin, Mail } from "lucide-react";
import { Page, Label, CTABanner, inter } from "../pages/shared";
import { Article, ArticleSummary, SITE_NAME, SITE_URL, extractFaq, formatDate, getArticle, getRelatedArticles, useSeo } from "./shared";
import { Markdown } from "./Markdown";
import { ArticleCard } from "./BlogPage";

type Status = "loading" | "notFound" | "error" | "ready";

function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  const links = [
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, icon: <Linkedin size={15} /> },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: <Facebook size={15} /> },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
      icon: <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
    },
    { label: "Share by email", href: `mailto:?subject=${t}&body=${u}`, icon: <Mail size={15} /> },
  ];
  const button = "w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#737373] hover:text-[#0a0a0a] hover:border-[#0a0a0a] transition-all";
  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#a3a3a3] mr-2">Share</span>
      {links.map(l => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" aria-label={l.label} title={l.label} className={button}>{l.icon}</a>
      ))}
      <button onClick={copy} aria-label="Copy link" title={copied ? "Copied" : "Copy link"} className={button}>
        {copied ? <Check size={15} /> : <Link2 size={15} />}
      </button>
    </div>
  );
}

export function BlogPostPage({ navigate }: { navigate: (p: Page) => void }) {
  const { slug = "" } = useParams();
  const [status, setStatus] = useState<Status>("loading");
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setArticle(null);
    setRelated([]);
    getArticle(slug)
      .then(a => {
        if (cancelled) return;
        if (!a) { setStatus("notFound"); return; }
        setArticle(a);
        setStatus("ready");
        getRelatedArticles(a.category, a.slug).then(r => { if (!cancelled) setRelated(r); }).catch(() => {});
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [slug]);

  const url = `${SITE_URL}/blog/${slug}`;
  const faq = article ? extractFaq(article.content) : [];

  useSeo(article && {
    title: `${article.title} | ${SITE_NAME}`,
    description: article.excerpt,
    canonical: url,
    type: "article",
    image: article.imageUrl || undefined,
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.excerpt,
        ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        articleSection: article.category,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
      ...(faq.length ? [{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(f => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }] : []),
    ],
  });

  if (status !== "ready" || !article) {
    return (
      <div style={{ fontFamily: inter }} className="pt-40 pb-32 px-6 bg-white min-h-[60vh]">
        <div className="max-w-[720px] mx-auto">
          {status === "loading" && <p className="text-sm text-[#a3a3a3]">Loading article…</p>}
          {status === "notFound" && (
            <>
              <Label>Blog</Label>
              <h1 className="text-4xl font-black text-[#0a0a0a] tracking-[-0.03em] mb-4">Article not found</h1>
              <p className="text-[#737373] text-[15px] mb-8">This article may have been moved or removed.</p>
              <Link to="/blog" className="inline-flex items-center gap-2 rounded-full font-semibold text-sm tracking-wide transition-all duration-200 bg-[#0a0a0a] text-white hover:bg-[#333] px-6 py-3">Browse all articles</Link>
            </>
          )}
          {status === "error" && <p className="text-sm text-[#737373]">This article couldn't be loaded right now. Please refresh the page to try again.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: inter }}>
      <article className="pt-28 pb-16 px-6 bg-white">
        <div className="max-w-[720px] mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-[#737373] hover:text-[#0a0a0a] transition-colors mb-10">
            <ArrowLeft size={14} /> All articles
          </Link>
          <Label>{article.category}</Label>
          <h1 className="text-4xl md:text-5xl font-black text-[#0a0a0a] leading-[1.08] tracking-[-0.03em] mb-5">{article.title}</h1>
          <p className="text-lg text-[#737373] leading-relaxed mb-6">{article.excerpt}</p>
          <div className="flex items-center gap-2 text-xs text-[#a3a3a3] pb-8 border-b border-[#e5e5e5]">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
        </div>

        {article.imageUrl && (
          <div className="max-w-[960px] mx-auto mt-10">
            <img src={article.imageUrl} alt="" className="w-full aspect-[2/1] object-cover rounded-2xl border border-[#e5e5e5]" />
            <p className="text-[11px] text-[#c4c4c4] mt-2 text-right">
              Photo from <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer nofollow" className="hover:text-[#a3a3a3]">Pexels</a>
            </p>
          </div>
        )}

        <div className="max-w-[720px] mx-auto mt-10">
          <Markdown>{article.content}</Markdown>

          <p className="text-xs text-[#a3a3a3] leading-relaxed mt-12 p-5 bg-[#fafafa] border border-[#e5e5e5] rounded-2xl">
            This article is for general education only and is not legal, tax, accounting or investment advice. Rules and
            figures change and vary by state — confirm anything that affects a decision with a licensed professional.
          </p>

          <div className="mt-8 pt-8 border-t border-[#e5e5e5]">
            <ShareButtons title={article.title} url={url} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-16 px-6 border-t border-[#e5e5e5] bg-[#fafafa]">
          <div className="max-w-[1200px] mx-auto">
            <Label>Keep Reading</Label>
            <h2 className="text-3xl font-black text-[#0a0a0a] tracking-[-0.02em] mb-8">More on {article.category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map(a => <ArticleCard key={a.slug} article={a} />)}
            </div>
          </div>
        </section>
      )}

      <CTABanner navigate={navigate} />
    </div>
  );
}
