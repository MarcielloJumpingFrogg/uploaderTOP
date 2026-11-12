import { ProjectError } from '@/customErrors/ErrorBase';
import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';
import type { Items } from '../../generated/prisma/client';

export async function updateInSharedFolders(dbEntryResult: Items) {
  if (
    dbEntryResult.parentFolderId == null ||
    dbEntryResult.parentFolderId == 'Home'
  )
    return;

  const { data: parentFolderInSharedFiles, error: errorGettingParentFolder } =
    await tryCatch(
      prisma.sharedFiles.findMany({
        where: {
          originalFile: dbEntryResult.parentFolderId,
        },
      }),
    );

  if (errorGettingParentFolder) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Could not find the parentFolder inside the sharedFiles',
      cause: errorGettingParentFolder,
    });
  }
  if (!parentFolderInSharedFiles) return;

  for (const i of parentFolderInSharedFiles) {
    const { data, error } = await tryCatch(
      prisma.sharedFiles.create({
        data: {
          destinationUser: i.destinationUser,
          originalFile: dbEntryResult.id,
          sessionId: i.sessionId,
          parentFolder: i.originalFile,
        },
      }),
    );

    if (error) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message:
          'Error creating the new shareFile inside updateInSharedFolders',
        cause: error,
      });
    }

    if (!data) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'Could not create the sharedFile',
      });
    }
  }
}
