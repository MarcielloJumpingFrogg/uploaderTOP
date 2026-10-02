import { readFile } from "./readFile";
import { admin_supabase } from "../config/supabase";
import { checkExists } from "./checkExists";

export async function getAvatar(id: string) {
  if (!checkExists("avatars/" + id, "avatar")) {
    return "/static/userPlaceholder.svg";
  }
  const result = admin_supabase.storage
    .from("avatar")
    .getPublicUrl("avatars/" + id);
  // const result = await readFile("avatar", "avatars/" + id);
  // console.log(result);
  return result.data.publicUrl;
}

// getAvatar("10");
