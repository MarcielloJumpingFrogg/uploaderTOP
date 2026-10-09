import type { item, element, metadata } from "./fileTypes";

export function getFileType(element: element) {
  let filetype;
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
  const mimetype = element.item.metadata.mimetype.split("/") || [
    "other",
    "other",
  ];
  let first: any = mimetype[0];
  let second: any = mimetype[1];
  if (first == "text") {
    filetype = "txt";
  }
  if (second == "octet-stream") {
    filetype = "other";
  }
  const splitElement = second.split(".");
  for (let i = 0; i < splitElement.length; i++) {
    if (extensions.includes(splitElement[i])) {
      filetype = splitElement[i];
    }
  }
  if (element.type == "folder") {
    filetype = "folder";
  }
  if (!filetype) {
    //catch situation
    filetype = "other";
  }
  return filetype;
}
