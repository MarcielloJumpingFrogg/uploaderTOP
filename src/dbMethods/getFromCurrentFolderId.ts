import { prisma } from "../../lib/prisma";
import type { Items } from "../../generated/prisma/client";
import logger from "../../config/logger";
import { tryCatch } from "@/customErrors/tryCatch";

export async function getFromCurrentFolderId(
  currentFolderId: string | undefined,
  userIsOwner: boolean,
  userId: string,
): Promise<Items | null> {
  try {
    if (
      currentFolderId === "Home" ||
      currentFolderId === undefined ||
      userIsOwner === undefined ||
      userIsOwner === true
    ) {
      logger.error(`Home: ${currentFolderId}`);
      // logger.test(`userIsOwner: ${userIsOwner}`);
      return null;
    }

    const { data: sharedFile, error: sharedFileError } = await tryCatch(
      prisma.sharedFiles.findUnique({
        where: { id: currentFolderId, destinationUser: userId },
      }),
    );

    if (sharedFileError) {
      throw new Error("shared file error");
    }

    // logger.test("sharedFile: ", sharedFile);
    if (!sharedFile) {
      logger.error("!sharedFile");
      return null;
    }

    const { data: session, error: sessionError } = await tryCatch(
      prisma.shareSession.findUniqueOrThrow({
        where: { id: sharedFile?.sessionId },
      }),
    );

    logger.test("session: ", session);

    if (sessionError || !session) {
      throw new Error("session error");
    }
    // logger.test("session: ", session);
    const { data: originalFolder, error: originalFolderError } = await tryCatch(
      prisma.items.findUniqueOrThrow({
        where: { id: sharedFile?.originalFile },
      }),
    );

    if (originalFolderError) {
      throw new Error("original folder error");
    }
    // logger.test("originalFolder: ", originalFolder);

    if (!originalFolder) {
      logger.error("original folder");
      return null;
    }

    return originalFolder;
  } catch (e: any) {
    throw new Error("Error during 'getFromSharedFile': ", e);
  }
}
