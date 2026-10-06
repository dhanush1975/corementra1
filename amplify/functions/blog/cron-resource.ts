import { defineFunction, secret } from '@aws-amplify/backend';

// Writes and publishes one article a day. This is the only path that puts an
// AI-written article live without a person reviewing it first. It has no
// HTTP endpoint: only its EventBridge schedule can invoke it.
export const blogCron = defineFunction({
  name: 'blog-cron',
  entry: './cron-handler.ts',
  timeoutSeconds: 300,
  memoryMB: 512,
  schedule: { cron: '0 18 * * ? *', timezone: 'UTC' },
  environment: {
    ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
    PEXELS_API_KEY: secret('PEXELS_API_KEY'),
    ANTHROPIC_MODEL: 'claude-opus-5-5',
  },
});
