import { admin_supabase } from "../../config/supabase";
import { updateAvatarVersion } from "../prismaDb/updateAvatarVersion";
import { getFileBase64 } from "../fileMethods/getFileBase64";

export async function updateAvatar(name: string, newFile: any, userId: string) {
  try {
    const result = await admin_supabase.storage
      .from("avatar")
      .update(name, getFileBase64(newFile), {
        cacheControl: "3600",
        contentType: newFile.mimetype,
      });

    await updateAvatarVersion(userId);
    return result;
  } catch (e) {
    console.error(e);
  }
}
