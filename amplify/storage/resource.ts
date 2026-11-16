import { defineStorage } from '@aws-amplify/backend';

// Flyer images attached to birthday/anniversary email templates. Only the
// signed-in admin can upload/manage them; the sending Lambda reads them
// directly via IAM (granted in backend.ts), not through this access rule.
export const storage = defineStorage({
  name: 'corementraFlyers',
  access: allow => ({
    'flyers/*': [allow.authenticated.to(['read', 'write', 'delete'])],
  }),
});
