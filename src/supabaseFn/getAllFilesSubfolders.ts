import { admin_supabase } from "../../config/supabase";
import { readFolder } from "./readFolder";

export async function getAllFilesSubfolders(
  path: string,
  bucket: string,
  previousResults: Array<string>,
) {
  const fileList = previousResults;
  const result = await readFolder(path, bucket, "server");

  for (let i = 0; i < result.length; i++) {
    if (result[i].type === "folder") {
      //subfolder1
      previousResults.concat(fileList);
      fileList.concat(
        await getAllFilesSubfolders(
          path + "/" + result[i].item.name,
          bucket,
          fileList,
        ),
      );
    } else {
      fileList.push(path + "/" + result[i].item.name);
    }
  }
  return fileList;
}
