import { admin_supabase } from "../config/supabase";
import { checkExists } from "./checkExists";
import { updateAvatar } from "./updateAvatar";

export async function uploadFile(
  fileBase64: any,
  file: any,
  bucket: string,
  name: string,
  userId: string,
) {
  try {
    if (await checkExists(name, bucket)) {
      console.log("Confirmed exists");
      updateAvatar(name, fileBase64, file, userId);
    } else {
      console.log("does not exist");
      const result = await admin_supabase.storage
        .from(bucket)
        .upload(name, fileBase64, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.mimetype,
        });

      console.log("Result: ", result);
      return result;
    }
  } catch (e) {
    console.error("Error catched: ", e);
  }
}
