// One-time bulk load of the sample Db + real product dataset, done through
// the actual GraphQL API (authenticated as the admin user) so every record
// gets the same shape (__typename, createdAt, updatedAt, etc.) a normal
// create() from the app would produce. A raw DynamoDB write bypasses that
// and produces items the generated client can't parse back out.
//
// Run:  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' node scripts/migrate-seed-data.mjs
// (credentials come from the environment so they never land in the repo or
// in a process listing as command-line arguments)
import { Amplify } from "aws-amplify";
import { signIn } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json" with { type: "json" };

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/migrate-seed-data.mjs");
  process.exit(1);
}

Amplify.configure(outputs);
const client = generateClient();

async function createAll(modelName, items) {
  let ok = 0;
  for (const item of items) {
    const res = await client.models[modelName].create(item);
    if (res.errors?.length) {
      console.error(`  ${modelName} create failed for id=${item.id}:`, res.errors);
    } else {
      ok++;
    }
  }
  console.log(`  ${modelName}: ${ok}/${items.length} created`);
}

async function main() {
  const { isSignedIn } = await signIn({ username: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!isSignedIn) throw new Error("Sign-in did not complete (unexpected next step).");
  console.log("Signed in as", ADMIN_EMAIL);

  const { seed, PROD_SEED } = await import("../src/app/dashboard/data.ts");
  const db = seed();

  console.log("\nWriting seed data via GraphQL...");
  await createAll("Event", db.events);
  await createAll("Prospect", db.prospects);
  await createAll("Client", db.clients);
  await createAll("Purchase", db.purchases);
  await createAll("FollowUp", db.followUps);
  await createAll("Feedback", db.feedback);
  await createAll("Agent", db.agents);
  console.log(`\nWriting ${PROD_SEED.length} real US products via GraphQL (this takes a bit)...`);
  await createAll("Product", PROD_SEED);

  console.log("\nMigration complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
