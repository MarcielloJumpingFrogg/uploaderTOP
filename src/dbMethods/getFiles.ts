import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { readFolder } from "../supabaseFn/readFolder";
import { getFromPath } from "./getFromPath";

export async function getFiles(userId: string, currentFolder: string) {
  const name = currentFolder;
  const result = await readFolder(name, "Files", "user");

  const fileSharedFromOthers = await prisma.sharedFiles.findMany({
    where: {
      destinationUser: userId
    }
  })

  for (let i = 0; i < fileSharedFromOthers.length; i++) {
    const file = fileSharedFromOthers[i];
    const shareSessionResult = await prisma.shareSession.findMany({where:{id: file?.sessionId}})

    const getFromPathResult = await getFromPath(file);
    for (let j = 0; j < getFromPathResult.length; j++) {
      result.push(getFromPathResult[j]);
    }
  }

  return result;
}
