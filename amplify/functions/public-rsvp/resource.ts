import { defineFunction } from '@aws-amplify/backend';

// The only thing an anonymous visitor can reach: backs the two public
// operations (getPublicEvent / registerForEvent) declared in
// data/resource.ts. It validates every field and decides server-side what
// gets stored, so the public API key never has direct access to a model.
export const publicRsvp = defineFunction({
  name: 'public-rsvp',
  entry: './handler.ts',
  timeoutSeconds: 15,
  // It's both a resolver in the data schema and a consumer of the data API —
  // grouping it with data avoids a circular dependency between the stacks.
  resourceGroupName: 'data',
});
