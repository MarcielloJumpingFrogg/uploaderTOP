import { admin_supabase } from "../config/supabase";

export async function checkExists(fileName: string, bucket: string) {
  try {
    const { data, error } = await admin_supabase.storage
      .from(bucket)
      .exists(fileName);

    // console.error("CheckExists error: ", error);
    // console.log("data", data);
    return data;
  } catch (e) {
    console.error(e);
    return false;
  }
}
