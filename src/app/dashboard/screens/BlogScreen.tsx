import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Eye, Plus, RefreshCw, Sparkles, Trash2, X, Zap } from "lucide-react";
import { client } from "../client";
import { uid } from "../data";
import { DBtn, DCard, DInput, DSelect, EmptyState, Field, KpiCard, Modal, Pill } from "../ui";
import { BLOG_CATEGORIES } from "../../blog/shared";
import { Markdown } from "../../blog/Markdown";
import { TOPICS } from "../../../../amplify/functions/blog/topics";

type Tab = "overview" | "articles" | "queue" | "generate";

interface ArticleRow {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  readTime: string;
  imageUrl: string;
  publishedAt: string;
  deletedAt: string;
}

interface QueueItem {
  id: string;
  title: string;
  category: string;
  position: number;
}

// What the blog-writer function returns (WrittenArticle in
// amplify/functions/blog/article-writer.ts).
interface Draft {
  title: string;
  excerpt: string;
  readTimeMinutes: number;
  content: string;
  searchIntent: string;
  trafficAngle: string;
  reviewChecklist: string[];
  sourcesToVerify: { label: string; url: string; why: string }[];
  riskNotes: string[];
  slug: string;
  read_time: string;
  image_url: string;
}

type Toast = { tone: "green" | "red"; text: string } | null;

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "articles", label: "Articles" },
  { id: "queue", label: "Queue" },
  { id: "generate", label: "Generate" },
];

// A draft takes about 70 seconds. The writer reports nothing until it's
// done, so these steps follow the clock, not the writer's real progress.
const STEPS = [
  { at: 0, label: "Sending the topic to the writer" },
  { at: 6, label: "Outlining the article" },
  { at: 20, label: "Writing the article" },
  { at: 55, label: "Building the review checklist" },
  { at: 75, label: "Finishing up" },
];
const POLL_MS = 4000;
const GIVE_UP_MS = 6 * 60 * 1000;

const CATEGORY_TONES: Record<string, "neutral" | "blue" | "green" | "amber" | "red" | "purple"> = {
  "Life Insurance": "blue",
  "Retirement Planning": "green",
  "Estate Planning": "purple",
  "High Net Worth": "amber",
  "Financial Basics": "neutral",
  "Professional Careers": "red",
};
const CategoryPill = ({ category }: { category: string }) => <Pill tone={CATEGORY_TONES[category] ?? "neutral"}>{category}</Pill>;

// How many of the site-based topics "Add suggested topics" queues at a time.
const SUGGEST_BATCH = 12;

const ICON_BTN = "w-9 h-9 shrink-0 rounded-xl bg-white border border-[#e5e5e5] text-[#667085] flex items-center justify-center hover:bg-[#f5f5f5] hover:text-[#0a0a0a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
};
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return iso && !Number.isNaN(d.getTime()) ? d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";
};
const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const errText = (errors: readonly { message: string }[] | undefined) => errors?.length ? errors.map(e => e.message).join("; ") : "";

async function loadArticles(): Promise<ArticleRow[]> {
  const rows: ArticleRow[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await client.models.Article.list({ limit: 1000, nextToken });
    if (res.errors?.length) throw new Error(errText(res.errors));
    rows.push(...res.data.map(a => ({
      slug: a.slug,
      title: a.title,
      category: a.category || "General",
      excerpt: a.excerpt || "",
      content: a.content,
      readTime: a.readTime || "",
      imageUrl: a.imageUrl || "",
      publishedAt: a.publishedAt || "",
      deletedAt: a.deletedAt || "",
    })));
    nextToken = res.nextToken;
  } while (nextToken);
  return rows;
}

async function loadQueue(): Promise<QueueItem[]> {
  const res = await client.models.ArticleQueue.list({ limit: 1000 });
  if (res.errors?.length) throw new Error(errText(res.errors));
  return res.data
    .map(q => ({ id: q.id, title: q.title, category: q.category, position: q.position ?? 0 }))
    .sort((a, b) => a.position - b.position);
}

export function BlogScreen() {
  const [tab, setTab] = useState<Tab>("overview");
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef(0);

  // Articles tab
  const [filter, setFilter] = useState("All");
  const [viewing, setViewing] = useState<ArticleRow | null>(null);
  const [busySlug, setBusySlug] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Queue tab
  const [queueTitle, setQueueTitle] = useState("");
  const [queueCategory, setQueueCategory] = useState(BLOG_CATEGORIES[0]);
  const [suggesting, setSuggesting] = useState(false);

  // Generate tab
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(BLOG_CATEGORIES[0]);
  const [queueId, setQueueId] = useState("");
  const [phase, setPhase] = useState<"form" | "working" | "preview" | "published">("form");
  const [elapsed, setElapsed] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState("");
  const [genError, setGenError] = useState("");
  // Bumped whenever a generation is started or abandoned, so a poll loop
  // from an earlier run can tell it's stale and stop.
  const run = useRef(0);

  const notify = (tone: "green" | "red", text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast({ tone, text });
    toastTimer.current = window.setTimeout(() => setToast(null), tone === "red" ? 7000 : 3000);
  };

  const refresh = async () => {
    const [a, q] = await Promise.all([loadArticles(), loadQueue()]);
    setArticles(a);
    setQueue(q);
  };

  useEffect(() => {
    refresh()
      .catch(err => setLoadError(err instanceof Error ? err.message : "Could not load the blog."))
      .finally(() => setLoading(false));
    return () => { run.current++; window.clearTimeout(toastTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "working") return;
    const started = Date.now();
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const live = useMemo(() => articles.filter(a => !a.deletedAt).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)), [articles]);
  const deleted = useMemo(() => articles.filter(a => a.deletedAt).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)).slice(0, 20), [articles]);
  const shown = useMemo(() => live.filter(a => filter === "All" || a.category === filter).slice(0, 50), [live, filter]);
  // The site's categories, plus any older category an article still carries.
  const filterChips = useMemo(() => ["All", ...BLOG_CATEGORIES, ...Array.from(new Set(live.map(a => a.category))).filter(c => !BLOG_CATEGORIES.includes(c))], [live]);
  // Site-based topics that are neither published, deleted nor already queued.
  const suggestions = useMemo(() => {
    const taken = new Set([...articles.map(a => a.title), ...queue.map(q => q.title)].map(t => t.toLowerCase()));
    return TOPICS.filter(t => !taken.has(t.title.toLowerCase()));
  }, [articles, queue]);

  const reload = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch (err) {
      notify("red", err instanceof Error ? err.message : "Could not refresh.");
    } finally {
      setRefreshing(false);
    }
  };
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // ---- Articles ----------------------------------------------------------

  const softDelete = async (a: ArticleRow) => {
    if (!window.confirm(`Delete "${a.title}"?\n\nIt will be hidden from the blog straight away. You can restore it from Recently Deleted.`)) return;
    setBusySlug(a.slug);
    try {
      const res = await client.mutations.removeArticle({ slug: a.slug });
      if (res.errors?.length) throw new Error(errText(res.errors));
      setArticles(prev => prev.map(x => x.slug === a.slug ? { ...x, deletedAt: new Date().toISOString() } : x));
      setViewing(null);
      notify("green", "Article hidden. It's in Recently Deleted.");
    } catch (err) {
      notify("red", err instanceof Error ? err.message : "Could not delete the article.");
    } finally {
      setBusySlug("");
    }
  };

  const restore = async (a: ArticleRow) => {
    setBusySlug(a.slug);
    try {
      const res = await client.mutations.restoreArticle({ slug: a.slug });
      if (res.errors?.length) throw new Error(errText(res.errors));
      setArticles(prev => prev.map(x => x.slug === a.slug ? { ...x, deletedAt: "" } : x));
      notify("green", "Article restored and live again.");
    } catch (err) {
      notify("red", err instanceof Error ? err.message : "Could not restore the article.");
    } finally {
      setBusySlug("");
    }
  };

  const deleteForever = async (a: ArticleRow) => {
    if (!window.confirm(`Delete "${a.title}" forever?\n\nThis cannot be undone.`)) return;
    setBusySlug(a.slug);
    try {
      const res = await client.mutations.removeArticle({ slug: a.slug, permanent: true });
      if (res.errors?.length) throw new Error(errText(res.errors));
      setArticles(prev => prev.filter(x => x.slug !== a.slug));
      notify("green", "Article deleted forever.");
    } catch (err) {
      notify("red", err instanceof Error ? err.message : "Could not delete the article.");
    } finally {
      setBusySlug("");
    }
  };

  // ---- Queue -------------------------------------------------------------

  const addToQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = queueTitle.trim();
    if (!title) return;
    const item: QueueItem = { id: uid(), title, category: queueCategory, position: queue.length ? queue[queue.length - 1].position + 1 : 0 };
    const res = await client.models.ArticleQueue.create(item);
    if (res.errors?.length) { notify("red", errText(res.errors)); return; }
    setQueue(prev => [...prev, item]);
    setQueueTitle("");
  };

  const addSuggested = async () => {
    setSuggesting(true);
    const start = queue.length ? queue[queue.length - 1].position + 1 : 0;
    const items: QueueItem[] = suggestions.slice(0, SUGGEST_BATCH).map((t, i) => ({ id: uid() + uid(), title: t.title, category: t.category, position: start + i }));
    const results = await Promise.all(items.map(item => client.models.ArticleQueue.create(item).catch(() => null)));
    const added = items.filter((_, i) => results[i] && !results[i]!.errors?.length);
    setQueue(prev => [...prev, ...added]);
    setSuggesting(false);
    if (added.length < items.length) notify("red", `Added ${added.length} of ${items.length} topics; the rest could not be saved.`);
    else notify("green", `Added ${added.length} topics from your site.`);
  };

  const writeOneOff = () => {
    run.current++;
    setTopic("");
    setQueueId("");
    setDraft(null);
    setGenError("");
    setPhase("form");
    setTab("generate");
  };

  const moveInQueue = async (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= queue.length) return;
    const next = [...queue];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((q, i) => ({ ...q, position: i }));
    const before = queue;
    setQueue(renumbered);
    const changed = renumbered.filter(q => before.find(b => b.id === q.id)?.position !== q.position);
    const results = await Promise.all(changed.map(q => client.models.ArticleQueue.update({ id: q.id, position: q.position })));
    if (results.some(r => r.errors?.length)) {
      notify("red", "Could not save the new order.");
      loadQueue().then(setQueue).catch(() => {});
    }
  };

  const removeFromQueue = async (id: string) => {
    const res = await client.models.ArticleQueue.delete({ id });
    if (res.errors?.length) { notify("red", errText(res.errors)); return; }
    setQueue(prev => prev.filter(q => q.id !== id));
  };

  const writeFromQueue = (q: QueueItem) => {
    run.current++;
    setTopic(q.title);
    setCategory(BLOG_CATEGORIES.includes(q.category) ? q.category : BLOG_CATEGORIES[0]);
    setQueueId(q.id);
    setDraft(null);
    setGenError("");
    setPhase("form");
    setTab("generate");
  };

  // ---- Generate ----------------------------------------------------------

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const mine = ++run.current;
    const jobId = crypto.randomUUID();
    setGenError("");
    setDraft(null);
    setReviewed(false);
    setPhase("working");

    const fail = (message: string) => {
      if (run.current !== mine) return;
      setGenError(message);
      setPhase("form");
    };

    try {
      const res = await client.mutations.generateArticleDraft({ jobId, topic: topic.trim(), category });
      if (res.errors?.length) throw new Error(errText(res.errors));
    } catch (err) {
      fail(err instanceof Error ? err.message : "Could not start the writer.");
      return;
    }

    const started = Date.now();
    while (run.current === mine) {
      await new Promise(r => window.setTimeout(r, POLL_MS));
      if (run.current !== mine) return;
      if (Date.now() - started > GIVE_UP_MS) {
        fail("The writer didn't finish in time. Nothing was published — try again.");
        return;
      }
      const res = await client.models.ArticleDraft.get({ id: jobId }).catch(() => null);
      const row = res?.data;
      if (!row) continue;

      // The row has done its job: it only carries the result back here.
      client.models.ArticleDraft.delete({ id: jobId }).catch(() => {});
      if (run.current !== mine) return;
      if (row.status !== "ready" || !row.payload) {
        fail(row.error || "The writer couldn't produce a draft. Try again.");
        return;
      }
      try {
        setDraft(JSON.parse(row.payload) as Draft);
        setPhase("preview");
      } catch {
        fail("The draft came back in a form that couldn't be read. Try again.");
      }
      return;
    }
  };

  const discardDraft = () => {
    run.current++;
    setDraft(null);
    setReviewed(false);
    setPhase("form");
  };

  const publish = async () => {
    if (!draft || !reviewed) return;
    setPublishing(true);
    try {
      const res = await client.mutations.publishArticle({
        title: draft.title,
        slug: draft.slug,
        category,
        excerpt: draft.excerpt,
        content: draft.content,
        readTime: draft.read_time,
        imageUrl: draft.image_url,
        topic: topic.trim(),
      });
      if (res.errors?.length || !res.data) throw new Error(errText(res.errors) || "The article was not published.");
      setPublishedSlug(res.data);
      setPhase("published");
      if (queueId) {
        await client.models.ArticleQueue.delete({ id: queueId }).catch(() => {});
        setQueue(prev => prev.filter(q => q.id !== queueId));
      }
      setQueueId("");
      setTopic("");
      setDraft(null);
      setReviewed(false);
      loadArticles().then(setArticles).catch(() => {});
    } catch (err) {
      // Stay on the draft so nothing is lost and it can be tried again.
      notify("red", err instanceof Error ? err.message : "The article was not published.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <p className="text-sm text-[#98a2b3]">Loading...</p>;

  if (loadError) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-black">Blog</h2>
        <DCard className="p-5 text-sm text-[#a4372f]">
          The blog couldn't be loaded: {loadError}
        </DCard>
      </div>
    );
  }

  const activeStep = STEPS.reduce((acc, s, i) => (elapsed >= s.at ? i : acc), 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-xs uppercase tracking-wider text-[#98a2b3]">Content</div>
        <h2 className="text-2xl font-black mt-0.5">Blog</h2>
        <p className="text-sm text-[#667085] mt-1">
          One article is written and published automatically every day at 18:00 UTC. Anything you generate here stays a
          draft until you review it and publish it.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${tab === t.id ? "bg-[#0a0a0a] text-white" : "bg-white border border-[#e5e5e5] text-[#475467] hover:bg-[#f5f5f5]"}`}
          >
            {t.label}{t.id === "queue" && queue.length > 0 ? ` (${queue.length})` : ""}
          </button>
        ))}
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-xl text-sm border ${toast.tone === "green" ? "bg-[#eaf3ec] border-[#cfe5d6] text-[#1f6b4a]" : "bg-[#faeceb] border-[#f3dcda] text-[#a4372f]"}`}>
          {toast.text}
        </div>
      )}

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Live articles" value={String(live.length)} note="Visible on the blog" tone="green" />
            <KpiCard label="Published this week" value={String(live.filter(a => a.publishedAt >= weekAgo).length)} note="Last 7 days" tone="blue" />
            <KpiCard label="In the queue" value={String(queue.length)} note="Topics waiting to be written" tone="amber" />
            <KpiCard label="Recently deleted" value={String(articles.filter(a => a.deletedAt).length)} note="Hidden, can be restored" tone="red" />
          </div>
          <DCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold">Recent articles</h4>
              <DBtn variant="ghost" onClick={() => setTab("articles")}>View all</DBtn>
            </div>
            {live.length === 0 ? <EmptyState>No articles yet. Generate one, or wait for the daily article.</EmptyState> : (
              <div className="flex flex-col divide-y divide-[#f0f0f0]">
                {live.slice(0, 6).map(a => (
                  <button key={a.slug} onClick={() => setViewing(a)} className="flex items-center gap-3 py-3 text-left hover:bg-[#fafafa] -mx-2 px-2 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[#0a0a0a] truncate">{a.title}</div>
                      <div className="text-xs text-[#98a2b3] mt-0.5">{fmtDate(a.publishedAt)} · {a.readTime}</div>
                    </div>
                    <CategoryPill category={a.category} />
                  </button>
                ))}
              </div>
            )}
          </DCard>
        </>
      )}

      {tab === "articles" && (
        <>
          <div className="flex items-start justify-between gap-3 mt-2">
            <div>
              <h3 className="text-2xl font-black">Articles</h3>
              <p className="text-sm text-[#667085] mt-0.5">{live.length} published {live.length === 1 ? "article" : "articles"}</p>
            </div>
            <DBtn variant="secondary" onClick={reload} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
            </DBtn>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterChips.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${filter === c ? "bg-[#0a0a0a] text-white" : "bg-white border border-[#e5e5e5] text-[#475467] hover:bg-[#f5f5f5]"}`}
              >
                {c}
              </button>
            ))}
          </div>

          <DCard className="px-5 py-2">
            {shown.length === 0 ? <EmptyState>No published articles{filter !== "All" ? " in this category" : ""}.</EmptyState> : (
              <div className="flex flex-col divide-y divide-[#f0f0f0]">
                {shown.map(a => (
                  <div key={a.slug} className="flex items-center gap-4 py-4">
                    {a.imageUrl
                      ? <img src={a.imageUrl} alt="" loading="lazy" className="w-16 h-16 shrink-0 rounded-xl object-cover border border-[#e5e5e5]" />
                      : <div className="w-16 h-16 shrink-0 rounded-xl bg-[#fafafa] border border-[#e5e5e5]" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#0a0a0a] truncate">{a.title}</div>
                      <div className="text-sm text-[#667085] truncate mt-0.5">{a.excerpt}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        <CategoryPill category={a.category} />
                        <span className="text-xs font-mono text-[#98a2b3]">{fmtDateTime(a.publishedAt)} · {a.readTime}</span>
                      </div>
                    </div>
                    <DBtn variant="secondary" onClick={() => setViewing(a)} className="shrink-0"><Eye size={14} /> View</DBtn>
                    <button onClick={() => softDelete(a)} disabled={busySlug === a.slug} aria-label={`Delete ${a.title}`} title="Delete" className={`${ICON_BTN} !text-[#b4443a] !border-[#f3dcda] hover:!bg-[#fdf2f1]`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </DCard>

          <DCard className="p-5">
            <h4 className="text-base font-bold">Recently Deleted <span className="text-[#98a2b3] font-medium">({deleted.length})</span></h4>
            <p className="text-xs text-[#98a2b3] mt-0.5 mb-3">Hidden from the blog. Restore one to put it back, or delete it forever.</p>
            {deleted.length === 0 ? <EmptyState>Nothing here.</EmptyState> : (
              <div className="flex flex-col divide-y divide-[#f0f0f0]">
                {deleted.map(a => (
                  <div key={a.slug} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="flex-1 min-w-[220px]">
                      <div className="text-sm font-semibold text-[#667085]">{a.title}</div>
                      <div className="text-xs text-[#98a2b3] mt-0.5">Deleted {fmtDate(a.deletedAt)}</div>
                    </div>
                    <DBtn variant="secondary" disabled={busySlug === a.slug} onClick={() => restore(a)}>Restore</DBtn>
                    <DBtn variant="danger" disabled={busySlug === a.slug} onClick={() => deleteForever(a)}>Delete forever</DBtn>
                  </div>
                ))}
              </div>
            )}
          </DCard>
        </>
      )}

      {tab === "queue" && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
            <div>
              <h3 className="text-2xl font-black">Queue</h3>
              <p className="text-sm text-[#667085] mt-0.5">{queue.length} {queue.length === 1 ? "topic" : "topics"} queued for review and publishing</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.length > 0 && (
                <DBtn variant="secondary" onClick={addSuggested} disabled={suggesting}>
                  {suggesting ? "Adding..." : `Add ${Math.min(SUGGEST_BATCH, suggestions.length)} topics from your site`}
                </DBtn>
              )}
              <DBtn onClick={writeOneOff}><Sparkles size={14} /> Write a one-off topic</DBtn>
            </div>
          </div>

          <DCard className="p-4">
            <form onSubmit={addToQueue} className="flex flex-col md:flex-row gap-3 md:items-center">
              <DInput value={queueTitle} onChange={e => setQueueTitle(e.target.value)} placeholder="Add a topic to the queue" aria-label="Topic" maxLength={200} className="flex-1" />
              <DSelect value={queueCategory} onChange={e => setQueueCategory(e.target.value)} aria-label="Category" className="md:!w-56">
                {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </DSelect>
              <DBtn type="submit" disabled={!queueTitle.trim()} className="shrink-0"><Plus size={14} /> Add</DBtn>
            </form>
          </DCard>

          {queue.length === 0 ? (
            <DCard className="p-5">
              <EmptyState>The queue is empty. Add a topic above, or add topics based on your site's services.</EmptyState>
            </DCard>
          ) : (
            <>
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#eef7f1] border border-[#cfe5d6]">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-[#dff0e5] border border-[#cfe5d6] text-[#14683f] flex items-center justify-center"><Zap size={17} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#2f8a5b]">Next to write and review</div>
                  <div className="text-base font-bold text-[#0a0a0a] mt-0.5">{queue[0].title}</div>
                </div>
                <CategoryPill category={queue[0].category} />
              </div>

              <div className="flex flex-col gap-2.5">
                {queue.map((q, i) => (
                  <div key={q.id} className={`flex flex-wrap items-center gap-3 px-4 py-3.5 rounded-2xl border ${i === 0 ? "bg-[#f3faf5] border-[#cfe5d6]" : "bg-white border-[#e5e5e5]"}`}>
                    <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[13px] font-bold ${i === 0 ? "bg-[#2f8a5b] text-white" : "bg-[#fafafa] border border-[#e5e5e5] text-[#98a2b3]"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-[200px]">
                      <div className="text-[15px] font-semibold text-[#0a0a0a]">{q.title}</div>
                      {i === 0 && <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#2f8a5b] mt-1">Review next</div>}
                    </div>
                    <CategoryPill category={q.category} />
                    <DBtn onClick={() => writeFromQueue(q)}>Write <ArrowRight size={14} /></DBtn>
                    <button onClick={() => moveInQueue(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up" className={ICON_BTN}><ArrowUp size={15} /></button>
                    <button onClick={() => moveInQueue(i, 1)} disabled={i === queue.length - 1} aria-label="Move down" title="Move down" className={ICON_BTN}><ArrowDown size={15} /></button>
                    <button onClick={() => removeFromQueue(q.id)} aria-label="Remove from queue" title="Remove from queue" className={ICON_BTN}><X size={15} /></button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#98a2b3]">The daily automatic article picks its own topic from the same site-based list and doesn't use this queue.</p>
            </>
          )}
        </>
      )}

      {tab === "generate" && phase === "form" && (
        <DCard className="p-5">
          <h4 className="text-base font-bold">Generate a draft</h4>
          <p className="text-xs text-[#98a2b3] mt-0.5 mb-4">Takes about a minute. Nothing is published until you review the draft and press Publish.</p>
          <form onSubmit={generate} className="flex flex-col gap-3 max-w-2xl">
            <Field label="Topic">
              <DInput value={topic} onChange={e => { setTopic(e.target.value); setQueueId(""); }} placeholder="e.g. How does a living trust work?" maxLength={200} />
            </Field>
            <Field label="Category">
              <DSelect value={category} onChange={e => setCategory(e.target.value)}>
                {BLOG_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </DSelect>
            </Field>
            {queueId && <p className="text-xs text-[#98a2b3]">From the queue — it will be removed from the queue once published.</p>}
            {genError && <p className="text-sm text-[#a4372f]">{genError}</p>}
            <DBtn type="submit" disabled={!topic.trim()} className="self-start">Generate draft</DBtn>
          </form>
        </DCard>
      )}

      {tab === "generate" && phase === "working" && (
        <DCard className="p-5">
          <h4 className="text-base font-bold">Writing "{topic.trim()}"</h4>
          <p className="text-xs text-[#98a2b3] mt-0.5 mb-4">Usually about 70 seconds — {elapsed}s so far. You can leave this tab open and wait.</p>
          <div className="flex flex-col gap-2.5">
            {STEPS.map((s, i) => (
              <div key={s.label} className={`flex items-center gap-3 text-sm ${i < activeStep ? "text-[#14683f]" : i === activeStep ? "text-[#0a0a0a] font-semibold" : "text-[#98a2b3]"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${i < activeStep ? "bg-[#e7f4ec]" : i === activeStep ? "bg-[#0a0a0a] text-white animate-pulse" : "bg-[#f2f4f7]"}`}>
                  {i < activeStep ? "✓" : i + 1}
                </span>
                {s.label}
              </div>
            ))}
          </div>
          <DBtn variant="ghost" onClick={discardDraft} className="mt-5">Cancel</DBtn>
        </DCard>
      )}

      {tab === "generate" && phase === "preview" && draft && (
        <>
          <DCard className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Pill tone="amber">Draft — not published</Pill>
              <CategoryPill category={category} />
              <Pill>{draft.read_time}</Pill>
              <Pill>{wordCount(draft.content).toLocaleString()} words</Pill>
            </div>
            <h3 className="text-xl font-black text-[#0a0a0a]">{draft.title}</h3>
            <p className="text-sm text-[#667085] mt-2">{draft.excerpt}</p>
            <p className="text-xs text-[#98a2b3] mt-2">Will be published at /blog/{draft.slug}</p>
          </DCard>

          <DCard className="p-5 flex flex-col gap-5">
            <div>
              <h4 className="text-base font-bold">Review before publishing</h4>
              <p className="text-xs text-[#98a2b3] mt-0.5">The writer flagged these itself. It can still be wrong about things it didn't flag.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-[#667085] mb-1">Traffic angle</div>
                <p className="text-sm text-[#344054]">{draft.trafficAngle}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-[#667085] mb-1">Search intent</div>
                <p className="text-sm text-[#344054]">{draft.searchIntent}</p>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-[#667085] mb-1.5">Checklist</div>
              {draft.reviewChecklist.length === 0 ? <p className="text-sm text-[#98a2b3]">None listed.</p> : (
                <ol className="list-decimal pl-5 space-y-1 text-sm text-[#344054]">
                  {draft.reviewChecklist.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#667085] mb-1.5">Sources to verify</div>
              {draft.sourcesToVerify.length === 0 ? <p className="text-sm text-[#98a2b3]">None listed.</p> : (
                <ul className="space-y-2 text-sm text-[#344054]">
                  {draft.sourcesToVerify.map((s, i) => (
                    <li key={i}>
                      {/^https?:\/\//.test(s.url)
                        ? <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-[#0070f3] underline underline-offset-2">{s.label}</a>
                        : <span className="font-semibold">{s.label}</span>}
                      <span className="text-[#667085]"> — {s.why}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#667085] mb-1.5">Risk notes</div>
              {draft.riskNotes.length === 0 ? <p className="text-sm text-[#98a2b3]">None listed.</p> : (
                <ul className="list-disc pl-5 space-y-1 text-sm text-[#8a5a1a]">
                  {draft.riskNotes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              )}
            </div>
          </DCard>

          <DCard className="p-5">
            <h4 className="text-base font-bold mb-3">Full article (Markdown)</h4>
            <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap break-words text-[13px] leading-relaxed font-mono text-[#344054] bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-4">{draft.content}</pre>
          </DCard>

          <DCard className="p-5 flex flex-col gap-4">
            <label className="flex items-start gap-3 text-sm text-[#344054] cursor-pointer">
              <input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0a0a0a]" />
              <span>I reviewed the sources, dates, figures and risky claims above, and this article is accurate and fine to publish.</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <DBtn onClick={publish} disabled={!reviewed || publishing}>{publishing ? "Publishing..." : "Publish"}</DBtn>
              <DBtn variant="secondary" onClick={discardDraft} disabled={publishing}>Discard draft</DBtn>
            </div>
          </DCard>
        </>
      )}

      {tab === "generate" && phase === "published" && (
        <DCard className="p-6 flex flex-col gap-3 items-start">
          <Pill tone="green">Published</Pill>
          <h4 className="text-lg font-bold">The article is live.</h4>
          <p className="text-sm text-[#667085]">It can take up to five minutes to show on the blog list for a visitor who already has the page open.</p>
          <div className="flex flex-wrap gap-2 mt-1">
            <a href={`/blog/${publishedSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full text-[13px] font-semibold px-4 py-2 bg-[#0a0a0a] text-white hover:bg-[#333] transition-colors">View article</a>
            <DBtn variant="secondary" onClick={() => setPhase("form")}>Write another</DBtn>
          </div>
        </DCard>
      )}

      {viewing && (
        <Modal title={viewing.title} subtitle={`${viewing.category} · ${fmtDate(viewing.publishedAt)} · ${viewing.readTime}`} onClose={() => setViewing(null)} wide>
          <div className="flex flex-wrap gap-2 mb-4">
            <a href={`/blog/${viewing.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full text-[13px] font-semibold px-4 py-2 bg-white border border-[#e5e5e5] text-[#344054] hover:bg-[#f5f5f5] transition-colors">Open on the site</a>
            <DBtn variant="danger" disabled={busySlug === viewing.slug} onClick={() => softDelete(viewing)}>Delete</DBtn>
          </div>
          <Markdown>{viewing.content}</Markdown>
        </Modal>
      )}
    </div>
  );
}
