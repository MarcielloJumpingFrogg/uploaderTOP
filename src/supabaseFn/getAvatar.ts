// import { readFile } from "./readFile";
import { admin_supabase } from "../../config/supabase";
import { checkExists } from "./checkExists";
import { getAvatarVersion } from "../../src/prismaDb/getAvatarVersion";

export async function getAvatar(id: string) {
  if (!(await checkExists("avatars/" + id, "avatar"))) {
    return "/static/userPlaceholder.svg";
  }
  const result = admin_supabase.storage
    .from("avatar")
    .getPublicUrl("avatars/" + id);

  const avatarVersion = await getAvatarVersion(id);
  const cachedVersion =
    result.data.publicUrl + "?cacheVersion=" + avatarVersion;
  return cachedVersion;
}
