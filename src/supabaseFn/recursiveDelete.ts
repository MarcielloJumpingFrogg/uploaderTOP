import { admin_supabase } from "../../config/supabase";

export async function recursiveDelete(bucket: string) {
  await admin_supabase.storage.emptyBucket(bucket)
}
