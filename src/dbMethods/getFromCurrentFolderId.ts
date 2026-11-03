import { prisma } from "../../lib/prisma";
import type { Files } from "../../generated/prisma/client";
import logger from "../../config/logger";

export async function getFromCurrentFolderId(
  currentFolderId: string | undefined,
  userIsOwner: boolean,
  userId: string,
): Promise<Files | null> {
  try {
    if (
      currentFolderId == "Home" ||
      currentFolderId !== undefined ||
      userIsOwner !== undefined ||
      userIsOwner != true
    ) {
      return null;
    }

    const sharedFile = await prisma.sharedFiles.findUnique({
      where: { id: currentFolderId, destinationUser: userId },
    });

    if (!sharedFile) {
      logger.test("file");

      return null;
    }

    const session = await prisma.shareSession.findUniqueOrThrow({
      where: { id: sharedFile?.sessionId },
    });
    const originalFolder: Files = await prisma.files.findUniqueOrThrow({
      where: { id: session?.originalFile },
    });

    if (!originalFolder) {
      logger.test("folder");
      return null;
    }

    return originalFolder;
  } catch (e: any) {
    throw new Error("Error during 'getFromSharedFile': ", e);
  }
}
