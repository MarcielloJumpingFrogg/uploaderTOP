import logger from "../../config/logger";
import { admin_supabase } from "../../config/supabase";


export async function readFolder(
  folder: string,
  bucket: string,
  context: string,
) {
  let FullList: any = [];
  try {
    const ownerId = folder.split("/")[0];
    const { data, error } = await admin_supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: "name", order: "asc" },
      });
    if (error) {
      throw new Error(error.message);
    }
    // Handle files vs folders
    data?.forEach((item) => {
      const path =  folder + "/" + item.name
      let currentType
      if (item.id !== null) {
        // It's a file
        if (item.name !== ".emptyFolderPlaceholder" || context !== "user") {
          currentType = "file"
        }
      } else {
        // It's a folder
        currentType = "folder"
      }
      FullList.push({type: currentType, ownerId: ownerId, path: path, item})
    });
  } catch (e) {
    logger.error(e);
  }
  return FullList;
}
