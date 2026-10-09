import { admin_supabase } from "../../config/supabase";

export async function checkExists(fileName: string, bucket: string) {
  try {
    const { data, error } = await admin_supabase.storage
      .from(bucket)
      .exists(fileName);
    if (error) {
      console.error(error);
    }
    return data;
  } catch (e) {
    console.error(e);
    return false;
  }
}
