import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

export async function getSharedFiles(userId: string, currentFolderId: string) {
  const files = await prisma.sharedFiles.findMany({
    where: { destinationUser: userId },
  });
  const foundFiles = [];

  files.forEach(async (file) => {
    const shareSession = await prisma.shareSession.findUnique({
      where: { id: file.sessionId },
    });

    const originalFile = await prisma.files.findFirst({
      where: { id: shareSession?.originalFile },
    });

    logger.test("originalFile: ", originalFile);
    foundFiles.push(originalFile);
  });

  logger.test("foundFiles", foundFiles);
}
