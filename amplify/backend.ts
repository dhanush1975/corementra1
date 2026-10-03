import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CfnWebACL, CfnWebACLAssociation } from 'aws-cdk-lib/aws-wafv2';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { sendOccasionEmails } from './functions/send-occasion-emails/resource';
import { publicRsvp } from './functions/public-rsvp/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  sendOccasionEmails,
  publicRsvp,
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
// Scoped to the one sending domain and the one From address, so this role
// can't be used to send as any other identity verified in the account.
const senderStack = Stack.of(backend.sendOccasionEmails.resources.lambda);
backend.sendOccasionEmails.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: [`arn:aws:ses:${senderStack.region}:${senderStack.account}:identity/corementra.com`],
    conditions: { StringEquals: { 'ses:FromAddress': 'contact@corementra.com' } },
  }),
);

// The frontend uses the model introspection baked into amplify_outputs.json,
// not live schema introspection — so there's no reason to hand the full
// schema to anyone holding the public API key.
backend.data.resources.cfnResources.cfnGraphqlApi.introspectionConfig = 'DISABLED';

// Rate-limit the public surface. Only requests carrying the public API key
// are counted (the signed-in dashboard authenticates with a Cognito token
// instead, and legitimately fires bursts of writes on a restore/import), so
// this caps how fast any one address can submit registrations.
const wafStack = backend.createStack('ApiFirewall');
const apiFirewall = new CfnWebACL(wafStack, 'ApiWebAcl', {
  scope: 'REGIONAL',
  defaultAction: { allow: {} },
  visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: 'corementraApi', sampledRequestsEnabled: true },
  rules: [
    {
      name: 'PublicApiKeyRateLimit',
      priority: 0,
      action: { block: {} },
      visibilityConfig: { cloudWatchMetricsEnabled: true, metricName: 'publicApiKeyRateLimit', sampledRequestsEnabled: true },
      statement: {
        rateBasedStatement: {
          // 100 is the lowest limit WAF accepts: 100 requests per 5 minutes
          // per IP. A registration is 2 requests, so a shared kiosk or a
          // venue's Wi-Fi stays well under it.
          limit: 100,
          evaluationWindowSec: 300,
          aggregateKeyType: 'IP',
          scopeDownStatement: {
            sizeConstraintStatement: {
              fieldToMatch: { singleHeader: { Name: 'x-api-key' } },
              comparisonOperator: 'GT',
              size: 0,
              textTransformations: [{ priority: 0, type: 'NONE' }],
            },
          },
        },
      },
    },
  ],
});
new CfnWebACLAssociation(wafStack, 'ApiWebAclAssociation', {
  resourceArn: backend.data.resources.graphqlApi.arn,
  webAclArn: apiFirewall.attrArn,
});
