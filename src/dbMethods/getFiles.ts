import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { readFolder } from "../supabaseFn/readFolder";
import { getFromPath } from "./getFromPath";

export async function getFiles(userId: string, currentFolder: string) {
  const name = userId + "/" + currentFolder;
  const result = await readFolder(name, "Files", "user");

  const fileSharedFromOthers = await prisma.sharedFiles.findMany({
    where: {
      destinationUser: userId,
    }
  })


  let getFromPathResult
  for (let i = 0; i < fileSharedFromOthers.length; i++) {
    const file = fileSharedFromOthers[i];
    const shareSession = await prisma.shareSession.findUnique({where: {id: file?.sessionId}})

    const targetFilePath = shareSession?.originalUser + "/" + currentFolder

    if (shareSession?.filePath.startsWith(targetFilePath)) {
      getFromPathResult = await getFromPath(file);
    } else {
    }


    for (let j = 0; j < getFromPathResult.length; j++) {
      result.push(getFromPathResult[j]);
    }
  }

  return result;
}
