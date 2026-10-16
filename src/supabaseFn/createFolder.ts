import { admin_supabase } from "../../config/supabase";

export async function createFolder(name: string, bucket: string) {
  const _result = await admin_supabase.storage
    .from(bucket)
    .upload(name + "/.emptyFolderPlaceholder", "");
}
