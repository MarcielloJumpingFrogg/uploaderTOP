import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost:8000",
  process.env.SUPABASE_PUBLIC,
);

const admin_supabase = createClient(
  process.env.SUPABASE_URL || "http://localhost:8000",
  process.env.SUPABASE_SECRET,
);

export { supabase, admin_supabase };
