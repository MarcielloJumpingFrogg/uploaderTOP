import { getFileType } from "./getFileType";
import type { element, item, metadata } from "./fileTypes";

export async function getFileList(files: any) {
  const loadedFiles: { id: string; type: string; name: string }[] = [];

  files.forEach((element: element) => {
    const item = element.item;
    let filetype;
    let id;
    if (element.type == "file") {
      id = item.id;
      filetype = getFileType(element);
    } else if (element.type == "folder") {
      id = "0";
      filetype = "folder";
    }

    // const file: any = element;
    const finalFile = {
      id: id,
      type: filetype,
      name: item.name,
    };

    loadedFiles.push(finalFile);
  });

  return loadedFiles;
}
