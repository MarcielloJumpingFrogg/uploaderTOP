import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { tryCatch } from "../customErrors/tryCatch";

export async function getSharedFiles(userId: string, currentFolderId: string) {
  const { data: files, error: fileError } = await tryCatch(
    prisma.sharedFiles.findMany({
      where: { destinationUser: userId },
    }),
  );
  if (fileError) throw new Error("Error during sharedFile.find : ", fileError);

  const foundFiles: {
    id: string;
    ownerId: string;
    parentFolder: string;
    fileName: string;
    type: string;
    size: string;
    updated_at: Date;
    created_at: Date;
  }[] = [];

  files.forEach(async (file) => {
    const shareSession = await prisma.shareSession.findUnique({
      where: { id: file.sessionId },
    });

    const { data: originalFile, error: fileError } = await tryCatch(
      prisma.files.findFirst({
        where: { id: shareSession?.originalFile },
      }),
    );

    if (fileError)
      throw new Error(
        "Error from prisma.files of shareSession.originalFile: ",
        fileError,
      );

    if (originalFile == null)
      throw new Error(
        "Error: the 'originalFile' is null, could not push it to foundFiles",
      );
    foundFiles.push(originalFile);
  });

  return foundFiles;
  // logger.test("foundFiles", foundFiles);
}
