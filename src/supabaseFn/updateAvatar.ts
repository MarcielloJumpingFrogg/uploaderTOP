import { admin_supabase } from "../../config/supabase";
import { updateAvatarVersion } from "../prismaDb/updateAvatarVersion";

export async function updateAvatar(
  name: string,
  newBase64File: any,
  newFile: any,
  userId: string,
) {
  try {
    const result = await admin_supabase.storage
      .from("avatar")
      .update(name, newBase64File, {
        cacheControl: "3600",
        contentType: newFile.mimetype,
      });

    await updateAvatarVersion(userId);
    return result;
  } catch (e) {
    console.error(e);
  }
}
