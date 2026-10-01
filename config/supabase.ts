import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost:8000",
  process.env.SUPABASE_PUBLISHABLE_KEY,
);

const admin_supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost:8000",
  process.env.SUPABASE_SECRET_KEY,
);

export { supabase, admin_supabase };
