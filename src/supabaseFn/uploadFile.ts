import { admin_supabase } from "../../config/supabase";
import { checkExists } from "./checkExists";
import { updateAvatar } from "./updateAvatar";
import { decode } from "base64-arraybuffer";

export async function uploadFile(
  file: any,
  bucket: string,
  name: string,
  userId: string,
) {
  try {
    const fileBase64 = decode(file.buffer.toString("base64"));
    if (await checkExists(name, bucket)) {
      await updateAvatar(name, fileBase64, file, userId);
    } else {
      const result = await admin_supabase.storage
        .from(bucket)
        .upload(name, fileBase64, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.mimetype,
        });

      return result;
    }
  } catch (e) {
    console.error("Error catched: ", e);
  }
}
