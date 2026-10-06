import { defineFunction, secret } from '@aws-amplify/backend';

// Backs the dashboard's "Generate draft" button. Invoked asynchronously (see
// generateArticleDraft in data/resource.ts) because an article takes about
// 70 seconds to write and an AppSync resolver is cut off at 30. It parks the
// finished draft in ArticleDraft for the dashboard to pick up; it never
// touches Article.
export const blogWriter = defineFunction({
  name: 'blog-writer',
  entry: './writer-handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
  environment: {
    ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
    PEXELS_API_KEY: secret('PEXELS_API_KEY'),
    ANTHROPIC_MODEL: 'claude-opus-5-5',
  },
  // It's both a resolver in the data schema and a consumer of the data API —
  // grouping it with data avoids a circular dependency between the stacks.
  resourceGroupName: 'data',
});
