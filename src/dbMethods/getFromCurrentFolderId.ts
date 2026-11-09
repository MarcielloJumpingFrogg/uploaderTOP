import { prisma } from '../../lib/prisma';
import type { Items } from '../../generated/prisma/client';
import { tryCatch } from '@/customErrors/tryCatch';
import { ProjectError } from '@/customErrors/ErrorBase';

export async function getFromCurrentFolderId(
  currentFolderId: string | undefined,
  userIsOwner: boolean,
  userId: string,
): Promise<Items> {
  if (currentFolderId === 'Home' || currentFolderId === undefined) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'CurrentFolder id is Home or undefined',
    });
  }
  if (userIsOwner === undefined || userIsOwner === true) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'UserIs the owner, so no Id can be found',
    });
  }

  const { data: sharedFile, error: sharedFileError } = await tryCatch(
    prisma.sharedFiles.findUnique({
      where: { id: currentFolderId, destinationUser: userId },
    }),
  );

  if (sharedFileError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while getting sharedFile',
      cause: sharedFileError,
    });
  }

  if (!sharedFile) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'Shared File is Empty',
    });
  }

  const { data: session, error: sessionError } = await tryCatch(
    prisma.shareSession.findUniqueOrThrow({
      where: { id: sharedFile?.sessionId },
    }),
  );

  if (sessionError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error getting the session',
      cause: sessionError,
    });
  }
  if (!session) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'Session is Empty',
    });
  }
  const { data: originalFolder, error: originalFolderError } = await tryCatch(
    prisma.items.findUniqueOrThrow({
      where: { id: sharedFile?.originalFile },
    }),
  );

  if (originalFolderError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error getting the originalFolder',
      cause: originalFolderError,
    });
  }

  if (!originalFolder) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'No original folder found',
    });
  }

  return originalFolder;
}
