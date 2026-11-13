import { getOwnedFiles } from './getOwnedFiles';
import { getSharedFiles } from './getSharedFiles';
import type { Items } from '../../generated/prisma/client';
import { ProjectError } from '@/customErrors/ErrorBase';
import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';

export async function getAllFiles(
  folderOwner: string,
  originalFolderId: string | null,
  userIsOwner: boolean,
  currentUser: string,
  shareSessionTemp?: string,
) {
  if (shareSessionTemp) {
    const { data, error } = await tryCatch(prisma.items.findMany());
  }

  //ownedFiles:
  const ownedFiles = await getOwnedFiles(
    folderOwner,
    originalFolderId,
    userIsOwner,
  );

  //sharedFiles:
  const sharedFiles = await getSharedFiles(currentUser, originalFolderId);

  if (sharedFiles == null) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message:
        'sharedFiles is null while using getSharedFiles inside getAllFiles',
    });
  }

  let finalSharedFiles: Items[] = [...sharedFiles];

  return { ownedFiles, finalSharedFiles };
}
