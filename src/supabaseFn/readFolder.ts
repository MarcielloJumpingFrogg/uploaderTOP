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
    console.log("readFolder folder: ", folder);
    // Handle files vs folders
    console.log("dataa; ", data);
    data?.forEach((item) => {
      console.log("dataItem: ", item);
      if (item.id !== null) {
        // It's a file
        if (item.name !== ".emptyFolderPlaceholder" || context !== "user") {
          FullList.push({ type: "file", item });
        }
      } else {
        // It's a folder
        FullList.push({ type: "folder", item });
      }
    });
  } catch (e) {
    logger.error(e);
  }
  return FullList;
}
