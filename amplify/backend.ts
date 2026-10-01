import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data,
});

// Single-user dashboard: block public self-registration at the Cognito
// level. The one admin user is created directly via `aws cognito-idp
// admin-create-user`, never through a frontend sign-up form.
backend.auth.resources.cfnResources.cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};
