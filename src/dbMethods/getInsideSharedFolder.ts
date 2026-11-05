import { tryCatch } from "@/customErrors/tryCatch";
import logger from "../../config/logger";
import { prisma } from "@prisma";
import type { Items } from "../../generated/prisma/client";

export async function getInsideSharedFolder(
  currentFolderId: string,
  userIsOwner: boolean,
  userId: string,
) {
  if (userIsOwner) return [];
  let originalFolder: { ownerId: string; id: string } | Items = {
    ownerId: userId,
    id: currentFolderId,
  };

  logger.test("original folder: ", originalFolder);

  const originalFolderId = originalFolder.id;
  const originalUserId = originalFolder.ownerId;

  const { data: ogFiles, error: ogError } = await tryCatch(
    prisma.items.findMany({
      where: { ownerId: originalUserId, parentFolder: originalFolderId },
    }),
  );

  const fileList: Files[] = [];

  if (ogError) {
    throw new Error("Error finding the original folder's files", ogError);
  }

  for (let i = 0; i < ogFiles.length; i++) {
    const file = ogFiles[i];
    let reservedId = file;
    if (file) {
      fileList.push(file);
    }
  }

  return fileList;
}
