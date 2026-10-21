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
    if (element.type == "folder") {
      id = "0";
      filetype = "folder";
    } else {
      if (element.sessionId == null) {
        filetype = getFileType(element);
        id = item.id;
      } else {
        filetype = element.type;
      }
    }
    const size = getSize(element);
    let mimetype;
    if (item.metadata !== null) {
      mimetype = item.metadata.mimetype;
    } else {
      mimetype = "folder";
    }

    const finalFile = {
      id: id || "0",
      type: filetype,
      mimetype: mimetype,
      sessionId: element.sessionId || "0",
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
