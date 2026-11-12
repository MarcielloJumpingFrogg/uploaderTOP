import type { Items } from '../../generated/prisma/client';
import { prisma } from '@prisma';
import { tryCatch } from '../customErrors/tryCatch';
import { ProjectError } from '@/customErrors/ErrorBase';
import logger from '../../config/logger';

export async function getSharedFiles(
  userId: string,
  originalFolderId: string | null,
): Promise<Items[]> {
  let parentFolder: string | null =
    originalFolderId == 'Home' ? null : originalFolderId;

  const { data: sharedFiles, error: fileError } = await tryCatch(
    prisma.sharedFiles.findMany({
      where: { destinationUser: userId, parentFolder: parentFolder },
    }),
  );

  if (fileError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while getting the file shared with the user',
      cause: fileError,
    });
  }

  const foundFiles: Items[] = [];

  for (const file of sharedFiles) {
    if (!file) {
      return [];
    }

    const { data: shareSession, error: shareSessionError } = await tryCatch(
      prisma.shareSession.findUnique({
        where: { id: file.sessionId },
      }),
    );

    if (
      shareSession &&
      Number(shareSession?.expiration) <= Number(Date.now())
    ) {
      const { data: deleteResult, error: deleteError } = await tryCatch(
        prisma.shareSession.delete({
          where: {
            id: shareSession.id,
          },
        }),
      );

      if (deleteError) {
        throw new ProjectError({
          name: 'SERVER_ERROR',
          message: 'Error while deleting the expired session',
          cause: deleteError,
        });
      }

      if (!deleteResult) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'Empty deleteResult, no file was deleted',
        });
      }

      continue;
    }
    if (shareSessionError) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'Error getting shareSession in getSharedFiles',
        cause: shareSessionError,
      });
    }

    if (!shareSession) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'ShareSession is Empty in getSharedFiles',
      });
    }

    const { data: originalFile, error: fileError } = await tryCatch(
      prisma.items.findFirst({
        where: {
          id: file.originalFile,
          parentFolderId: parentFolder,
        },
      }),
    );

    if (fileError) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'Error getting File in getSharedFiles',
        cause: shareSessionError,
      });
    }

    if (!originalFile) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'OriginalFile is Empty in getSharedFiles',
      });
    }

    let safeGuardedId = originalFile;
    safeGuardedId.id = file.id;

    foundFiles.push(safeGuardedId);
  }

  return foundFiles;
}
