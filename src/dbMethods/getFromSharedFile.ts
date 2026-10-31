import { prisma } from "../../lib/prisma";

export async function getFromSharedFile(currentFolderId: string) {
  let currentFolder;
  let owner;

  try {
    const sharedFile = await prisma.sharedFiles.findUniqueOrThrow({
      where: { id: currentFolderId },
    });
    const session = await prisma.shareSession.findUniqueOrThrow({
      where: { id: sharedFile?.sessionId },
    });
    const originalFolder = await prisma.files.findUniqueOrThrow({
      where: { id: session?.originalFile },
    });
    owner = originalFolder.ownerId;

    return { originalFolder, owner };
  } catch (e: any) {
    throw new Error("Error during 'getFromSharedFile': ", e);
  }
}
