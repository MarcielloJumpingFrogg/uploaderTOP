import { decode } from "base64-arraybuffer";

export function getFileBase64(file: any) {
  return decode(file.buffer.toString("base64"));
}
