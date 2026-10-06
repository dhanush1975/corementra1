import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod/v4';

// The one AI writer. Both the daily blog-cron function and the dashboard's
// "Generate draft" (blog-writer function) call writeArticle(), so there is a
// single prompt and a single schema.

// Mirrors BLOG_CATEGORIES in src/app/blog/shared.ts.
export const CATEGORIES = [
  'Life Insurance',
  'Retirement Planning',
  'Estate Planning',
  'High Net Worth',
  'Financial Basics',
  'Professional Careers',
] as const;
export type Category = (typeof CATEGORIES)[number];

const DEFAULT_MODEL = 'claude-opus-5-5';
// Models whose safety filters can decline a request outright. For these the
// API is asked to retry a wrongly declined request on another model.
const FALLBACK_MODELS = ['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5'];

const ArticleSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  readTimeMinutes: z.number().int(),
  content: z.string(),
  searchIntent: z.string(),
  trafficAngle: z.string(),
  reviewChecklist: z.array(z.string()),
  sourcesToVerify: z.array(z.object({ label: z.string(), url: z.string(), why: z.string() })),
  riskNotes: z.array(z.string()),
});

// category is a plain string here, checked in generateTopics(): the SDK's
// schema helper rejects the type-less {enum: [...]} that z.enum() produces.
const TopicSchema = z.object({
  title: z.string(),
  category: z.string().describe(`Exactly one of: ${CATEGORIES.join(', ')}`),
  keywords: z.string(),
});

const TopicsSchema = z.object({ topics: z.array(TopicSchema) });

export type Topic = z.infer<typeof TopicSchema>;
export type WrittenArticle = z.infer<typeof ArticleSchema> & {
  slug: string;
  read_time: string;
  image_url: string;
};

const SYSTEM_PROMPT = `You write articles for the blog of CoreMentra, a United States financial-education and planning practice. Its tagline is "Your Wealth. Our Mentra." Readers are working professionals, families and business owners who want plain-English explanations before they talk to a licensed professional.

Site focus areas, matching the services on the site:
- Life insurance: term and indexed universal life (IUL), no-medical-exam term, living benefits, how much cover a family needs, protecting income.
- Retirement planning: how 401(k)s and IRAs work, rollovers, the main retirement risks (longevity, inflation, market, tax, interest rate, health), principal protection, annuities, income that lasts.
- Estate planning: wills versus living trusts, probate, beneficiaries, powers of attorney, guardianship; it is for every age and income level.
- High-net-worth planning: irrevocable life insurance trusts (ILITs), estate taxes, passing wealth to the next generation.
- Financial basics: budgeting, emergency funds, debt, tax-deferred versus tax-free growth, how to choose and work with a financial professional.
- Professional careers: what licensed financial professionals do and how people start in the field. Never promise or imply any level of income.

Accuracy rules. These matter more than anything else, because readers make money decisions from this:
- Never invent laws, dates, prices, deadlines, contribution limits, tax rates, thresholds, forms, phone numbers or addresses. If you are not certain a figure is correct and current, leave the number out, describe it in words, and tell the reader where to check it (for example irs.gov or ssa.gov).
- Limits, brackets and exemption amounts change every year and vary by state. Say so wherever one is relevant.
- Use cautious language for legal, tax, financial, insurance, health and immigration claims: "generally", "in many cases", "depending on your state". Do not promise or imply any return, saving or outcome.
- This is education, not advice. Do not tell the reader to buy, sell or choose a specific product, and do not name or rank insurance carriers, funds or companies.
- Tell readers what to verify and with whom: a licensed financial professional, a CPA or an estate attorney, as fits the topic. CoreMentra does not give legal, tax or accounting advice.
- Never cite a source you are not sure exists. Link only to well-known primary sources such as government agencies, and only to a homepage or a page you are confident is real. When in doubt, name the source without a link.

Article format:
- 1,000 to 1,400 words of Markdown in "content". Do not repeat the title as a heading; start with a short introduction.
- Use ## for sections and ### for sub-sections, with lists, and a table where it genuinely helps a comparison. No images and no raw HTML.
- End with a section headed exactly "## FAQ", with each question as a ### heading followed by a short answer. Three to five questions.
- Write for a general reader: short paragraphs, concrete examples, no jargon without an explanation, no hype.

Besides the article, fill in the fields a human editor uses to review it before it is published:
- excerpt: one or two sentences for cards and search results.
- readTimeMinutes: whole minutes at about 220 words a minute.
- searchIntent: what someone searching this topic wants to find out.
- trafficAngle: why this article could earn search traffic.
- reviewChecklist: the specific claims in this article an editor must check before publishing.
- sourcesToVerify: where to check them. Use an empty string for url unless you are sure of it.
- riskNotes: anything that could be wrong, out of date, state-specific or a compliance concern.`;

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('The AI writer is not set up yet: the ANTHROPIC_API_KEY secret is missing.');
  return new Anthropic({ apiKey });
}

async function generate<T extends z.ZodType>(schema: T, system: string, prompt: string, maxTokens: number): Promise<z.infer<T>> {
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const response = await getClient().beta.messages.parse({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: betaZodOutputFormat(schema) },
    ...(FALLBACK_MODELS.includes(model)
      ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
      : {}),
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The AI declined to write about this topic. Try rewording it.');
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error('The article came out too long and was cut off. Try again, or narrow the topic.');
  }
  if (!response.parsed_output) {
    throw new Error('The AI returned something that could not be read as an article. Try again.');
  }
  return response.parsed_output;
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

// A cover photo is a nice-to-have: any failure just means no image.
async function findCoverImage(query: string) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return '';
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) return '';
    const data = (await res.json()) as { photos?: { src?: { large?: string } }[] };
    const photos = data.photos ?? [];
    if (!photos.length) return '';
    return photos[Math.floor(Math.random() * photos.length)].src?.large ?? '';
  } catch {
    return '';
  }
}

export async function writeArticle({ topic, category, keywords }: { topic: string; category: string; keywords?: string }): Promise<WrittenArticle> {
  const prompt = [
    `Write an article on this topic: ${topic}`,
    `Category: ${category}`,
    keywords ? `Work these search phrases in where they read naturally: ${keywords}` : '',
  ].filter(Boolean).join('\n');

  const [article, image_url] = await Promise.all([
    generate(ArticleSchema, SYSTEM_PROMPT, prompt, 16000),
    findCoverImage(keywords || category),
  ]);

  const slug = slugify(article.title);
  if (!slug) throw new Error('The AI returned an article without a usable title. Try again.');

  return {
    ...article,
    slug,
    read_time: `${Math.max(1, article.readTimeMinutes)} min read`,
    image_url,
  };
}

export async function generateTopics(usedTitles: string[], count: number): Promise<Topic[]> {
  const system = `You plan topics for the blog of CoreMentra, a United States financial-education and planning practice covering life insurance, retirement planning, estate planning, high-net-worth planning, everyday money skills and careers in financial services. Suggest topics a general reader would search for and that can be explained accurately without quoting figures that change every year.`;
  const prompt = `Suggest ${count} new article ${count === 1 ? 'topic' : 'topics, spread across the categories and each clearly different from the others'}.

These titles are already published or planned, so do not repeat or closely paraphrase any of them:
${usedTitles.map(t => `- ${t}`).join('\n') || '- (none yet)'}

For each topic return the article title, its category, and a few comma-separated search phrases.`;
  const { topics } = await generate(TopicsSchema, system, prompt, 8000);
  return topics
    .filter(t => t.title.trim())
    .slice(0, count)
    .map(t => ({ ...t, category: (CATEGORIES as readonly string[]).includes(t.category) ? t.category : 'Financial Basics' }));
}

export async function generateTopic(usedTitles: string[]): Promise<Topic> {
  const [topic] = await generateTopics(usedTitles, 1);
  if (!topic) throw new Error('The AI did not suggest a topic. Try again.');
  return topic;
}
