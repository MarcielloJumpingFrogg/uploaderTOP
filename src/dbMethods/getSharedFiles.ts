import logger from "../../config/logger";
import type { Files } from "../../generated/prisma/client";
import { prisma } from "@prisma";
import { tryCatch } from "../customErrors/tryCatch";

export async function getSharedFiles(
  userId: string,
  currentFolder: string,
): Promise<Files[]> {
  const { data: files, error: fileError } = await tryCatch(
    prisma.sharedFiles.findMany({
      where: { destinationUser: userId, parentFolder: currentFolder },
    }),
  );
  if (fileError) {
    logger.error("fileError", fileError);
    throw new Error("Error during sharedFile.find : ", fileError);
  }

  const foundFiles: Files[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file) {
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
      prisma.files.findFirst({
        where: {
          id: shareSession?.originalFile,
          parentFolder: currentFolder,
        },
      }),
    );

    if (fileError || !originalFile) {
      logger.error("fileError: ", fileError);
      throw new Error(
        `Error from prisma.files of shareSession.originalFile: ${fileError || "No originalFile"} `,
      );
    }

    foundFiles.push(originalFile);
  }

  return foundFiles;
}
