import { defineAuth } from '@aws-amplify/backend';

/**
 * Single-user auth gate for the internal CRM dashboard.
 * No self-signup UI is ever built in the frontend; the one admin user is
 * created directly via `aws cognito-idp admin-create-user`.
 * @see https://docs.amplify.aws/react/build-a-backend/auth/
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  multifactor: {
    mode: 'REQUIRED',
    totp: true,
  },
});
