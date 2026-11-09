import { ProjectError } from '@/customErrors/ErrorBase';
import logger from '../../config/logger';
import { prisma } from '@prisma';
import { tryCatch } from '@/customErrors/tryCatch';

function getParentFolder(bodyParentFolder: string | null | undefined) {
  //{{{
  if (bodyParentFolder == 'Home' || bodyParentFolder == undefined) {
    logger.test('current parent folder: null');
    return null;
  } else {
    logger.test('current parent folder: ', bodyParentFolder);
    return bodyParentFolder;
  }
  //}}}
}

export async function findOwnedFile(
  userId: string,
  bodyParentFolder: string | null | undefined,
  fileId: string,
) {
  //{{{
  const { data: ownedFile, error: ownedError } = await tryCatch(
    prisma.items.findUnique({
      where: {
        ownerId: userId,
        id: fileId,
        parentFolderId: getParentFolder(bodyParentFolder),
      },
    }),
  );

  if (ownedError)
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error during findOwnedFile',
      cause: ownedError,
    });

  if (!ownedFile) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'No ownedFile found with given id',
    });
  }

  return ownedFile;
  //}}}
}
