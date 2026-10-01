import { admin_supabase } from "../config/supabase";

export async function readFile(bucket: string, name: string) {
  const result = await admin_supabase.storage.from(bucket).info(name);

  return result;
}
