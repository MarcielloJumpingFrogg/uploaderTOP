import { resetBuckets, resetDb } from "./tests/functions";

async function resetAll() {
  await resetBuckets();
  await resetDb();
  console.log("done");
}

resetAll();
