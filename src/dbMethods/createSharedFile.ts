import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';
import type { ShareSession } from '../../generated/prisma/browser';
import type { Items } from '../../generated/prisma/client';
import { ProjectError } from '@/customErrors/ErrorBase';

export async function createSharedFile(
  filesInFolder: Items | undefined | null,
  shareSession: ShareSession,
  destinationUser: string,
) {
  if (!filesInFolder) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'filesInFolder is empty inside createSharedFile',
    });
  }

  const { data: createdShareFile, error: failedToCreateShareFile } =
    await tryCatch(
      prisma.sharedFiles.create({
        data: {
          destinationUser: destinationUser,
          sessionId: shareSession?.id,
          parentFolder: filesInFolder.parentFolderId || null,
          originalFile: filesInFolder.id || '',
        },
      }),
    );

  if (failedToCreateShareFile) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Could not create the sharedFile in createSharedFile',
      cause: failedToCreateShareFile,
    });
  }
  if (!createdShareFile) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'There is no createdShareFile in createSharedFile',
    });
  }

  return createdShareFile;
}
