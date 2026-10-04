import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sendOccasionEmails } from '../functions/send-occasion-emails/resource';
import { publicRsvp } from '../functions/public-rsvp/resource';

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

  // The public surface, in full: look up one event's name/status, and
  // submit a registration for it.
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
}).authorization(allow => [
  allow.resource(sendOccasionEmails).to(['query', 'mutate']),
  allow.resource(publicRsvp).to(['query', 'mutate']),
]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // Powers the two allow.publicApiKey() operations above (getPublicEvent
    // + registerForEvent). Max allowed lifetime is 365 days; the key needs
    // regenerating (redeploy) after that.
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
  // Request-level audit trail in CloudWatch, without logging the query
  // variables (which carry names, emails and phone numbers).
  logging: { fieldLogLevel: 'error', excludeVerboseContent: true, retention: '3 months' },
});
