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
    // Handle files vs folders
    data?.forEach((item) => {
      // console.log("dataItem: ", item);
      if (item.id !== null) {
        // It's a file
        if (item.name !== ".emptyFolderPlaceholder" || context !== "user") {
          FullList.push({ type: "file", ownerId: ownerId, item });
        }
      } else {
        // It's a folder
        FullList.push({ type: "folder", ownerId: ownerId, item });
      }
    });
  } catch (e) {
    logger.error(e);
  }
  return FullList;
}
