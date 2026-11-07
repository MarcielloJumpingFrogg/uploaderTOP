import logger from "../../config/logger";
import type { Items } from "../../generated/prisma/client";
import { prisma } from "@prisma";
import { tryCatch } from "../customErrors/tryCatch";

export async function getSharedFiles(
  userId: string,
  currentFolder: string,
): Promise<Items[]> {
  let parentFolder: string | null = currentFolder;
  if (parentFolder == "Home") parentFolder = null;
  logger.test(`parentFOlder: ${parentFolder}`);
  logger.test(`userId: ${userId}`);
  const { data: sharedFiles, error: fileError } = await tryCatch(
    prisma.sharedFiles.findMany({
      where: { destinationUser: userId, parentFolder: currentFolder },
    }),
  );
  logger.test("sharedFiles: ", sharedFiles);
  if (fileError) {
    logger.error("fileError", fileError);
    throw new Error("Error during sharedFile.find : ", fileError);
  }

  const foundFiles: Items[] = [];

  // logger.test("originalFile: ", sharedFiles);
  for (let i = 0; i < sharedFiles.length; i++) {
    const file = sharedFiles[i];
    if (!file) {
      // logger.test("No file");
      return [];
    }

    const { data: shareSession, error: shareSessionError } = await tryCatch(
      prisma.shareSession.findUnique({
        where: { id: file.sessionId },
      }),
    );

    if (shareSessionError || !shareSession) {
      logger.error("ShareSessionError: ", shareSessionError);
      throw new Error(
        `ShareSessionError: ${shareSessionError || "No shareSession"}`,
      );
    }

    const { data: originalFile, error: fileError } = await tryCatch(
      prisma.items.findFirst({
        where: {
          id: file.originalFile,
          parentFolderId: parentFolder,
        },
      }),
    );

    logger.test("originalFile: ", originalFile);

    if (fileError || !originalFile) {
      logger.error("fileError: ", fileError);
      throw new Error(
        `Error from prisma.items of shareSession.originalFile: ${fileError || "No originalFile"} `,
      );
    }

    let safeGuardedId = originalFile;
    safeGuardedId.id = file.id;

    foundFiles.push(safeGuardedId);
  }

  return foundFiles;
}
