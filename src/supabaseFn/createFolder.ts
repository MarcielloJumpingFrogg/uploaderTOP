import { admin_supabase } from "../../config/supabase";

export async function createFolder(name: string, bucket: string) {
  const result = await admin_supabase.storage
    .from(bucket)
    .upload(name + "/.emptyFolderPlaceholder", "");
  console.log(result);
}

// createFolder("test1", "Test");
