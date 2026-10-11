import { admin_supabase } from "../../config/supabase";

export async function readFile(name: string, bucket: string) {
  const result = await admin_supabase.storage.from(bucket).info(name);
  console.log("readFile: ", result);

  return result.data;
}
