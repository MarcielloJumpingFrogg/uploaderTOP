import logger from "../../config/logger";
import { admin_supabase } from "../../config/supabase";

export async function moveFile(
  oldFileName: string,
  newFileName: string,
  bucket: string,
) {
  try {
    const result = await admin_supabase.storage
      .from(bucket)
      .move(oldFileName, newFileName);
  } catch (e) {
    logger.error(e);
  }
}
