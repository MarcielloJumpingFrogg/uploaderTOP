import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

export async function getPath(parentFolderId: string) {
  const file = await prisma.files.findFirst({ where: { id: parentFolderId } });
  const owner = file?.ownerId;

  const path = [parentFolderId];

  let temp = file;
  while (temp?.parentFolder !== "Home" && temp) {
    path.push(temp?.parentFolder);
    temp = await prisma.files.findFirst({
      where: { ownerId: owner, id: parentFolderId },
    });
  }

  return path;
}
