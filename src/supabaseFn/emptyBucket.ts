import { admin_supabase } from "../../config/supabase";

export async function emptyBucket(bucket: string) {
  await admin_supabase.storage.emptyBucket(bucket);
}
