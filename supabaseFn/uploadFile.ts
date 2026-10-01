import { admin_supabase } from "../config/supabase";

export async function uploadFile(
  fileBase64: any,
  file: any,
  bucket: string,
  name: string,
) {
  const result = await admin_supabase.storage
    .from(bucket)
    .upload(name, fileBase64, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  console.log("Result: ", result);
}
