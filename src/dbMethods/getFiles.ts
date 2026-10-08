import { admin_supabase } from "../../config/supabase";
import { readFolder } from "../supabaseFn/readFolder";

export async function getFiles(userId: string, currentFolder: string) {
  const name = userId + "/" + currentFolder;
  const result = await readFolder(name, "Files", "user");
  console.log("getFilesa; ", result);
  return result;
}

// getFiles("78e2b31d-4d72-4b19-95e7-428f3a903dc3", "Home");
