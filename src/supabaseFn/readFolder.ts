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
    // Handle files vs folders
    data?.forEach((item) => {
      if (item.id !== null) {
        // It's a file
        if (item.name !== ".emptyFolderPlaceholder" || context !== "user") {
          console.log("wtf");
          FullList.push({ type: "file", item });
        }
      } else {
        // It's a folder
        FullList.push({ type: "folder", item });
      }
    });
  } catch (e) {
    console.error(e);
  }
  return FullList;
}
