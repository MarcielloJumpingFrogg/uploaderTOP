import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
// import { getPath } from "./getPath";

export async function getOwnedFiles(owner: string, currentFolderId: string) {
  let userId;
  if (owner == "0") {
    let file = await prisma.files.findFirst({
      where: { parentFolder: currentFolderId },
    });
    userId = file?.id;
  } else {
    userId = owner;
  }
  const result = await prisma.files.findMany({
    where: { ownerId: userId, parentFolder: currentFolderId },
  });

  logger.test("ownedFiles: ", result);
  // const path = await getPath(currentFolderId);

  return result;
}
