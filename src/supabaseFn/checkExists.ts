import { admin_supabase } from "../../config/supabase";
import logger from "../../config/logger";

export async function checkExists(fileName: string, bucket: string) {
  try {
    const { data, error } = await admin_supabase.storage
      .from(bucket)
      .exists(fileName);
    return data;
  } catch (e) {
    logger.error(e);

    return false;
  }
}
