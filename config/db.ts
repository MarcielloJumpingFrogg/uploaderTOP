import { createRequire } from "node:module";
import { getEnv } from "./getEnv";
const require = createRequire(import.meta.url);

require("dotenv/config");

function getDB() {
  const nodeEnv = getEnv();
  const pg = process.env.DOCKER_URL;
  if (nodeEnv == "docker") {
    return pg;
  } else if (nodeEnv == "test") {
    return process.env.TEST_DIRECT_URL;
  } else {
    return process.env.DIRECT_URL;
  }
}
const result = getDB();

export { result };
