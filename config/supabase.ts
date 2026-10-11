import { createClient } from "@supabase/supabase-js";
import { getEnv } from "./getEnv";
import "dotenv/config";
import logger from "./logger";

function getLink() {
  if (getEnv() === "test") {
    return process.env.TEST_SUPABASE_URL || "http://localhost:54325";
  } else {
    return process.env.SUPABASE_URL || "http://localhost:8000";
  }
  // return "http://localhost:54325";
}

function getKey() {
  if (getEnv() === "test") {
    return (
      process.env.TEST_SUPABASE_SECRET_KEY ||
      logger.error("MISSING TEST_SUPABASE_SECRET_KEY in .env")
    );
  } else {
    return (
      process.env.SUPABASE_SECRET_KEY ||
      logger.error("MISSING SUPABASE_SECRET_KEY in .env")
    );
  }
  // return process.env.TEST_SUPABASE_SECRET_KEY;
}

const admin_supabase = createClient(getLink(), getKey());

export { admin_supabase };
