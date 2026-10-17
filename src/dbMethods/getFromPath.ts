import logger from "../../config/logger";
import { admin_supabase } from "../../config/supabase";

export async function getFromPath(file: any) {
  const result = [];
    const folderObject = {
      type: file.fileType,
      sessionId: file.sessionId,
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
  return result;
}
