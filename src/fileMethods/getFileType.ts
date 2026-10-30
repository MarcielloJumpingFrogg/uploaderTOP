import { fileTypeFromBuffer } from "file-type";
import logger from "../../config/logger";

type FileMulter = {
  buffer: Buffer;
};

export async function getFileType(file: FileMulter) {
  let filetype;
  const type = await fileTypeFromBuffer(file.buffer);
  logger.test("file: ", Buffer.from(file.buffer));
  logger.test("type: ", type);

  const extensions = [
    "ae",
    "avi",
    "css",
    "csv",
    "excel",
    "file",
    "html",
    "illustrator",
    "jpeg",
    "mpeg",
    "ms-powerpoint",
    "other",
    "pdf",
    "photoshop",
    "png",
    "quicktime",
    "rar",
    "txt",
    "wave",
    "word",
    "x-eps",
    "zip",
  ];
  // const mimetype = element.item.metadata.mimetype.split("/") || [
  //   "other",
  //   "other",
  // ];

  if (extensions.includes(type?.ext)) {
    filetype = type?.ext;
  } else {
    filetype = "other";
  }

  // if (element.type == "folder") {
  //   filetype = "folder";
  // }
  if (!filetype) {
    //catch situation
    filetype = "other";
  }
  return filetype;
}
