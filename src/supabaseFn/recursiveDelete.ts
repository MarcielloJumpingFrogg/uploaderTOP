import { admin_supabase } from "../../config/supabase";
import { deleteFile } from "./deleteFile";
import { readFolder } from "./readFolder";

export async function recursiveDelete(path: string, bucket: string) {
  const fileList = await readFolder(path, bucket, "server");
  fileList.forEach(async (file: any) => {
    console.log("path: ", path);
    if (file.type == "folder") {
      const newPath = path + "/" + file.item.name;
      await recursiveDelete(newPath, bucket);
    } else {
      const newPath = path + "/" + file.item.name;
      await deleteFile(newPath, bucket);
    }
  });
}
