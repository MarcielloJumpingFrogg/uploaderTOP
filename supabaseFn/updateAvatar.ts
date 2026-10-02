import { admin_supabase } from "../config/supabase";

export async function updateAvatar(
  name: string,
  newBase64File: any,
  newFile: any,
) {
  try {
    const { data, error } = await admin_supabase.storage
      .from("avatar")
      .update(name, newBase64File, {
        cacheControl: "3600",
        contentType: newFile.mimetype,
      });

    console.log("Data: ", data);
    console.log("ERrorsa; ", error);
    return data;
  } catch (e) {
    console.error(e);
  }
}
