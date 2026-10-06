import { defineFunction } from '@aws-amplify/backend';

// Every read the public blog makes and every write to Article goes through
// this function (see the blog operations in data/resource.ts). The browser
// has no create/update/delete access to the Article model itself.
export const blogApi = defineFunction({
  name: 'blog-api',
  entry: './api-handler.ts',
  timeoutSeconds: 15,
  // It's both a resolver in the data schema and a consumer of the data API —
  // grouping it with data avoids a circular dependency between the stacks.
  resourceGroupName: 'data',
});
