import "dotenv/config";
import { getEnv } from "./getEnv";
import logger from "./logger";

function getDB() {
  try {
    const nodeEnv = getEnv();
    const pg = process.env["DOCKER_URL"];
    if (nodeEnv == "docker") {
      return pg;
    } else if (nodeEnv == "test") {
      const result = process.env["TEST_DIRECT_URL"];
      if (!result) throw new Error("No test_direct_url in .env");
      return result;
    } else {
      const result = process.env["DIRECT_URL"];
      if (!result) throw new Error("No DIRECT_URL in .env");
      return result;
    }
  } catch (e) {
    logger.error("Error getting db from .env ", e);
  }
}
const result = getDB();

export { result };
