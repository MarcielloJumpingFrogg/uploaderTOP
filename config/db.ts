import { createRequire } from "node:module";
import { getEnv } from "./getEnv";
const require = createRequire(import.meta.url);

require("dotenv/config");

function getDB() {
  // const nodeEnv = getEnv();
  // const pg = "postgresql://user123:password123@db:5432/db123";
  // if (nodeEnv == "docker") {
  //   return pg;
  // } else if (nodeEnv == "test") {
  //   // return process.env.TEST_DATABASE_URL;
  //   return process.env.TEST_DIRECT_URL;
  // } else {
  //   // return process.env.DATABASE_URL;
  //   return process.env.DIRECT_URL;
  // }
  return process.env.TEST_DIRECT_URL;
}
const result = getDB();

export { result };
