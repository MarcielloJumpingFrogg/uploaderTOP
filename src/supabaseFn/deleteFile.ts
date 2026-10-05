import { admin_supabase } from "../../config/supabase";

export async function deleteFile(name: string, bucket: string) {
  const { data, error } = await admin_supabase.storage
    .from(bucket)
    .remove([name]);
  return { data, error };
}
