import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

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
  }).authorization(allow => [allow.authenticated(), allow.publicApiKey().to(['read'])]),

  // Prospect allows public-API-key `create` only — the public
  // event-registration page (src/app/dashboard/EventRsvpPage.tsx) writes
  // new leads directly. Read/update/delete stay authenticated-only so a
  // visitor can never browse or tamper with existing prospects.
  //
  // Uses a public API key rather than allow.guest() (IAM via Identity
  // Pool) deliberately: IAM credentials from an unauthenticated Identity
  // Pool escalate to the pool's AUTHENTICATED role the moment the same
  // browser also has a signed-in Cognito session (e.g. the admin testing
  // an event link in one tab while signed into /dashboard in another) —
  // and that authenticated role has no grant here, since allow.authenticated()
  // on this schema means userPool (JWT) auth, not IAM. That produced a
  // real "Not Authorized" bug. A static API key has no session state to
  // collide with, so it works the same regardless of what else is signed
  // in in that browser.
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
  }).authorization(allow => [allow.authenticated(), allow.publicApiKey().to(['create'])]),

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
    status: a.string(),
    note: a.string(),
    agent: a.string(),
    completedAt: a.string(),
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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    // Powers the two allow.publicApiKey() rules above (public event
    // read + public prospect create). Max allowed lifetime is 365 days;
    // the key needs regenerating (redeploy) after that.
    apiKeyAuthorizationMode: { expiresInDays: 365 },
  },
});
