import { defineFunction } from '@aws-amplify/backend';

// Runs once a day, checks every Client/Prospect for a birthday or
// client-anniversary matching today, and sends the matching saved
// template (with its flyer, if any) via SES.
export const sendOccasionEmails = defineFunction({
  name: 'send-occasion-emails',
  entry: './handler.ts',
  timeoutSeconds: 60,
  schedule: { cron: '0 9 * * ? *', timezone: 'America/New_York' },
  environment: {
    SES_FROM_ADDRESS: 'contact@corementra.com',
  },
});
