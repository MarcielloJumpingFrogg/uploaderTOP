import { readFile } from "./readFile";
import { admin_supabase } from "../config/supabase";
import { checkExists } from "./checkExists";

export async function getAvatar(id: string) {
  if (!checkExists("avatars/" + id, "avatar")) {
    console.log("does not exits in getAvbatr");
    return "/static/userPlaceholder.svg";
  }
  // console.log("am i here");
  const result = admin_supabase.storage
    .from("avatar")
    .getPublicUrl("avatars/" + id);

  const cacheTimeStamp =
    result.data.publicUrl + "?cacheTimeStamp=" + Date.now();
  return cacheTimeStamp;
}
