import { getFileType } from "./getFileType";
import { getSize } from "./getSize";
import type { element, finalFile } from "./fileTypes";
import logger from "../../config/logger";

export async function getFileList(files: any) {
  const loadedFiles: finalFile[] = [];

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
      id: id || "0",
      type: filetype,
      ownerId: element.ownerId,
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
