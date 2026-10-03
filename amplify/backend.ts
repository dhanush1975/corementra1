import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendOccasionEmails } from './functions/send-occasion-emails/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  sendOccasionEmails,
});

// Single-user dashboard: block public self-registration at the Cognito
// level. The one admin user is created directly via `aws cognito-idp
// admin-create-user`, never through a frontend sign-up form.
backend.auth.resources.cfnResources.cfnUserPool.adminCreateUserConfig = {
  allowAdminCreateUserOnly: true,
};

// The daily birthday/anniversary sender needs to read the flyer bucket and
// send mail through SES — neither is covered by allow.resource() (that only
// grants the Data/AppSync access declared in data/resource.ts).
backend.sendOccasionEmails.addEnvironment('FLYER_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.storage.resources.bucket.grantRead(backend.sendOccasionEmails.resources.lambda);
backend.sendOccasionEmails.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  }),
);
