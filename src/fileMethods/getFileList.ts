import { getFileType } from "./getFileType";
import { getSize } from "./getSize";
import type { element, item, metadata } from "./fileTypes";

export async function getFileList(files: any) {
  const loadedFiles: item[] = [];

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

    const size = getSize(element);

    // const file: any = element;
    const finalFile = {
      id: id,
      type: filetype,
      name: item.name,
      size: size,
      updated_at: item.updated_at,
      created_at: item.created_at,
      metadata: item.metadata,
    };

    loadedFiles.push(finalFile);
  });

  return loadedFiles;
}
