import { admin_supabase } from "../../config/supabase";
import { getFileBase64 } from "../fileMethods/getFileBase64";

export async function uploadFile(file: any, bucket: string, name: string) {
  try {
    const fileBase64 = getFileBase64(file);
    const result = await admin_supabase.storage
      .from(bucket)
      .upload(name, fileBase64, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    return result;
  } catch (e) {
    console.error("Error catched: ", e);
  }
}
