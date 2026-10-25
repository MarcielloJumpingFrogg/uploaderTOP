import logger from "../../config/logger";
import { admin_supabase } from "../../config/supabase";

export async function moveFile(
  oldFileName: string,
  newFileName: string,
  bucket: string,
) {
  try {
    const { data, error } = await admin_supabase.storage
      .from(bucket)
      .move(oldFileName, newFileName);
    // logger.test("data: ", data);
    if (error) {
      logger.error("error", error);
    }
  } catch (e) {
    logger.error(e);
  }
}
