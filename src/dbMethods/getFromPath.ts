import { readFolder } from "../supabaseFn/readFolder";
import { admin_supabase } from "../../config/supabase";

export async function getFromPath(file: any) {
  const result = [];
  let folderResult;
  let fileResult;
  if (file?.mimetype === "folder") {
    const folderObject = {
      type: "folder",
      ownerId: file.ownerId,
      item: {
        name: file.fileName,
        version: null,
        id: null,
        updated_at: null,
        created_at: null,
        last_accessed_at: null,
        metadata: null,
        archived_at: null,
        is_delete_marker: null,
        is_versioned: null,
      },
    };
    result.push(folderObject);
  } else {
    fileResult = await admin_supabase.storage.from("Files").info(file.path);
    result.push(fileResult);
  }
  return result;
}
