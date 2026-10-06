import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendOccasionEmails } from '../functions/send-occasion-emails/resource';
import { publicRsvp } from '../functions/public-rsvp/resource';
import { blogApi } from '../functions/blog/api-resource';
import { blogWriter } from '../functions/blog/writer-resource';
import { blogCron } from '../functions/blog/cron-resource';

/**
 * CRM dashboard schema. Mirrors src/app/dashboard/types.ts exactly.
 *
 * Deliberate choices (see plan for rationale):
 * - Every field that's a TS string union in the frontend is modeled as
 *   a.string(), not a.enum() — several unions contain spaces/lowercase
 *   ("IN PROCESS", "Not decided yet") that aren't valid GraphQL enum
 *   identifiers. Validation stays client-side (data.ts's STAGES/KINDS/etc).
 * - No relationships (a.belongsTo/a.hasMany) — the frontend already does
 *   manual joins against flat id fields (eventId, prospectId, clientId,
 *   productId), kept as plain a.string() to match.
 */
const schema = a.schema({
  Event: a.model({
    name: a.string().required(),
    date: a.string().required(),
    location: a.string(),
    timeFrame: a.string(),
    expense: a.float(),
    status: a.string(),
    registered: a.integer(),
    attended: a.integer(),
    completedAt: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  // No model is reachable with the public API key. The public
  // event-registration page (src/app/dashboard/EventRsvpPage.tsx) goes
  // through the two custom operations at the bottom of this schema, which
  // run the public-rsvp function: it validates the input and fixes every
  // field a visitor has no business choosing (stage, agent, kind, birthday).
  //
  // Those operations use a public API key rather than allow.guest() (IAM
  // via Identity Pool) deliberately: IAM credentials from an unauthenticated
  // Identity Pool escalate to the pool's AUTHENTICATED role the moment the
  // same browser also has a signed-in Cognito session (e.g. the admin
  // testing an event link in one tab while signed into /dashboard in
  // another), which produced a real "Not Authorized" bug. A static API key
  // has no session state to collide with.
  Prospect: a.model({
    name: a.string().required(),
    email: a.string(),
    phone: a.string(),
    eventId: a.string(),
    source: a.string(),
    need: a.string(),
    agent: a.string(),
    stage: a.string(),
    plan: a.string(),
    lastContact: a.string(),
    notes: a.string(),
    kind: a.string(),
    completedAt: a.string(),
    birthday: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  Client: a.model({
    name: a.string().required(),
    email: a.string(),
    phone: a.string(),
    address: a.string(),
    type: a.string(),
    agent: a.string(),
    source: a.string(),
    since: a.string(),
    prospectId: a.string(),
    birthday: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  Purchase: a.model({
    clientId: a.string().required(),
    product: a.string().required(),
    date: a.string().required(),
    businessValue: a.float(),
    agentPct: a.float(),
  }).authorization(allow => [allow.authenticated()]),

  FollowUp: a.model({
    prospectId: a.string(),
    subject: a.string().required(),
    type: a.string(),
    dueDate: a.string(),
    dueTime: a.string(),
    status: a.string(),
    note: a.string(),
    agent: a.string(),
    completedAt: a.string(),
    contactCount: a.integer(),
    lastContactedAt: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  Feedback: a.model({
    clientId: a.string().required(),
    rating: a.string(),
    comment: a.string(),
    date: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  Agent: a.model({
    name: a.string().required(),
    uplineId: a.string(),
    title: a.string(),
    email: a.string(),
    phone: a.string(),
    joined: a.string(),
    region: a.string(),
    status: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  Product: a.model({
    category: a.string(),
    provider: a.string(),
    product: a.string(),
    base: a.float(),
    advance: a.float(),
    country: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  Sale: a.model({
    date: a.string(),
    clientId: a.string(),
    productId: a.string(),
    productLabel: a.string(),
    basePct: a.float(),
    premium: a.float(),
    agent: a.string(),
    contractPct: a.float(),
    status: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  PartnerIncome: a.model({
    date: a.string(),
    agent: a.string(),
    partner: a.string(),
    amount: a.float(),
    note: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  // Singleton row (fixed id "levels-singleton") standing in for
  // IncomeData.levels: number[] — commission level percentages.
  Settings: a.model({
    levels: a.integer().array(),
  }).authorization(allow => [allow.authenticated()]),

  // One row per occasion ("Birthday" / "Anniversary") — a single reusable
  // template, not per-milestone-year. {{name}} and {{years}} in body get
  // substituted by the sending function before it goes out.
  EmailTemplate: a.model({
    occasion: a.string().required(),
    subject: a.string(),
    body: a.string(),
    flyerKey: a.string(),
    active: a.boolean(),
  }).authorization(allow => [allow.authenticated()]),

  // Audit trail + same-year dedupe guard for the scheduled sender function.
  EmailLog: a.model({
    recipientType: a.string(),
    recipientId: a.string(),
    recipientEmail: a.string(),
    recipientName: a.string(),
    occasion: a.string(),
    sentAt: a.string(),
    status: a.string(),
    errorMessage: a.string(),
  }).authorization(allow => [allow.authenticated()]),

  // The public surface for events: look up one event's name/status, and
  // submit a registration for it. (The blog's public reads are further
  // down.)
  PublicEvent: a.customType({
    id: a.string().required(),
    name: a.string().required(),
    status: a.string(),
  }),

  getPublicEvent: a.query()
    .arguments({ id: a.string().required() })
    .returns(a.ref('PublicEvent'))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(publicRsvp)),

  registerForEvent: a.mutation()
    .arguments({
      eventId: a.string().required(),
      name: a.string().required(),
      email: a.string().required(),
      phone: a.string().required(),
      interest: a.string(),
      notes: a.string(),
    })
    .returns(a.boolean())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(publicRsvp)),

  // ---- Blog ----------------------------------------------------------
  // A published (or soft-deleted) article. `slug` is the key, so two
  // articles can never share a URL — a soft-deleted one still holds its
  // slug. The signed-in dashboard can read rows but not write them: every
  // write goes through the blog-api function (publishArticle /
  // removeArticle / restoreArticle below) or the daily blog-cron function.
  Article: a.model({
    slug: a.string().required(),
    title: a.string().required(),
    // The topic the article was written from. The AI picks its own title,
    // so this is what stops the daily job choosing the same topic twice.
    topic: a.string(),
    category: a.string(),
    excerpt: a.string(),
    content: a.string().required(),
    readTime: a.string(),
    imageUrl: a.string(),
    publishedAt: a.string(),
    // Soft delete: set = hidden from the public blog, restorable.
    deletedAt: a.string(),
  }).identifier(['slug']).authorization(allow => [allow.authenticated().to(['read'])]),

  // Topics waiting to be written, in the order shown on the Queue tab.
  ArticleQueue: a.model({
    title: a.string().required(),
    category: a.string().required(),
    position: a.integer(),
  }).authorization(allow => [allow.authenticated()]),

  // Where blog-writer leaves a generated draft (or the reason it failed)
  // for the dashboard to pick up. Never public, and not an article until a
  // person reviews it and publishes it.
  ArticleDraft: a.model({
    status: a.string().required(),
    topic: a.string(),
    category: a.string(),
    payload: a.string(),
    error: a.string(),
  }).authorization(allow => [allow.authenticated().to(['read', 'delete'])]),

  PublicArticleSummary: a.customType({
    slug: a.string().required(),
    title: a.string().required(),
    category: a.string(),
    excerpt: a.string(),
    readTime: a.string(),
    imageUrl: a.string(),
    publishedAt: a.string(),
  }),

  PublicArticle: a.customType({
    slug: a.string().required(),
    title: a.string().required(),
    category: a.string(),
    excerpt: a.string(),
    content: a.string().required(),
    readTime: a.string(),
    imageUrl: a.string(),
    publishedAt: a.string(),
    updatedAt: a.string(),
  }),

  // What the public /blog pages read. Soft-deleted articles are filtered
  // out inside the function, so they drop off the site everywhere at once.
  listPublicArticles: a.query()
    .returns(a.ref('PublicArticleSummary').array())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(blogApi)),

  getPublicArticle: a.query()
    .arguments({ slug: a.string().required() })
    .returns(a.ref('PublicArticle'))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(blogApi)),

  publishArticle: a.mutation()
    .arguments({
      title: a.string().required(),
      slug: a.string().required(),
      category: a.string().required(),
      excerpt: a.string(),
      content: a.string().required(),
      readTime: a.string(),
      imageUrl: a.string(),
      topic: a.string(),
    })
    .returns(a.string())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(blogApi)),

  // Soft delete by default; `permanent` only works on an article that is
  // already soft-deleted.
  removeArticle: a.mutation()
    .arguments({ slug: a.string().required(), permanent: a.boolean() })
    .returns(a.boolean())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(blogApi)),

  restoreArticle: a.mutation()
    .arguments({ slug: a.string().required() })
    .returns(a.boolean())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(blogApi)),

  // Starts a draft and returns straight away (async): writing takes about
  // 70 seconds, longer than a resolver may run. The result lands in
  // ArticleDraft under the caller's jobId. Saves nothing to Article.
  generateArticleDraft: a.mutation()
    .arguments({
      jobId: a.string().required(),
      topic: a.string().required(),
      category: a.string().required(),
    })
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(blogWriter).async()),
}).authorization(allow => [
  allow.resource(sendOccasionEmails).to(['query', 'mutate']),
  allow.resource(publicRsvp).to(['query', 'mutate']),
  allow.resource(blogApi).to(['query', 'mutate']),
  allow.resource(blogWriter).to(['query', 'mutate']),
  allow.resource(blogCron).to(['query', 'mutate']),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // Powers the allow.publicApiKey() operations above (getPublicEvent +
    // registerForEvent, and the blog's listPublicArticles +
    // getPublicArticle). Max allowed lifetime is 365 days; the key needs
    // regenerating (redeploy) after that.
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
  // Request-level audit trail in CloudWatch, without logging the query
  // variables (which carry names, emails and phone numbers).
  logging: { fieldLogLevel: 'error', excludeVerboseContent: true, retention: '3 months' },
});
