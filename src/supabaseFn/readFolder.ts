import logger from "../../config/logger";
import { admin_supabase } from "../../config/supabase";


export async function readFolder(
  folder: string,
  bucket: string,
  context: string,
) {
  let FullList: any = [];
  try {
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
    for (let i = 0; i < data.length; i++){
      const item = data[i]
      let skipping = false
      if (item == undefined) {
        throw new Error("item is undefined")
      }
      const path =  folder + "/" + item.name
      let currentType
      if (item.id !== null) {
        // It's a file
        if (item.name !== ".emptyFolderPlaceholder" || context !== "user") {
          currentType = "file"
        } else {
          skipping = true
        }
      } else {
        // It's a folder
        currentType = "folder"
      }
      if (!skipping) {
        FullList.push({type: currentType,  item})
      }
    }
  } catch (e) {
    logger.error(e);
  }
  return FullList;
}
