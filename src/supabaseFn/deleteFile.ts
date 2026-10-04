import { admin_supabase } from "../../config/supabase";

export async function deleteFile(name: string, bucket: string) {
  console.log(name);
  const { data, error } = await admin_supabase.storage
    .from(bucket)
    .remove([name]);
  console.log({ data, error });
  return { data, error };
}

// deleteFile("test1/.emptyFolderPlaceholder", "Test");
