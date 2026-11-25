import { defineStorage } from '@aws-amplify/backend';

// Flyer images attached to birthday/anniversary email templates. Only the
// signed-in admin can upload/manage them; the sending Lambda reads them
// directly via IAM (granted in backend.ts), not through this access rule.
//
// Client application documents also live in this bucket, under
// applications/<id>/, KMS-encrypted. They deliberately have no access rule
// here: only the applications function reaches them (IAM in backend.ts),
// handing out 5-minute upload/download links.
export const storage = defineStorage({
  name: 'corementraFlyers',
  access: allow => ({
    'flyers/*': [allow.authenticated.to(['read', 'write', 'delete'])],
  }),
});
