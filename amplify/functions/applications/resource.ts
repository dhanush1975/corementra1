import { defineFunction } from '@aws-amplify/backend';

// The only code that can read or write a client application's contents.
// It encrypts every questionnaire with the application KMS key before it is
// stored and decrypts it only for the signed-in dashboard; it also hands
// out short-lived upload/download links for the application documents.
// The key ARN and bucket name are added as environment variables in
// backend.ts, along with the KMS and S3 permissions.
export const applications = defineFunction({
  name: 'applications',
  entry: './handler.ts',
  timeoutSeconds: 20,
  memoryMB: 512,
  // A resolver in the data schema that also uses the data API — grouped
  // with data to avoid a circular dependency between the stacks.
  resourceGroupName: 'data',
});
