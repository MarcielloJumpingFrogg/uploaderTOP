import { prisma } from '@prisma';
import { tryCatch } from '@/customErrors/tryCatch';
import { ProjectError } from '@/customErrors/ErrorBase';

export async function createDbEntry(itemParams: {
  ownerId: string;
  fileName: string;
  fileType: string;
  size: string;
  parentFolderId: string | null;
}) {
  const { data: prismaFileList, error: errorPrismaFileList } = await tryCatch(
    prisma.items.create({
      data: {
        ownerId: itemParams.ownerId,
        fileName: itemParams.fileName,
        fileType: itemParams.fileType,
        size: itemParams.size,
        parentFolderId: itemParams.parentFolderId,
      },
    }),
  );
  if (errorPrismaFileList) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while creating the server entry for db',
      cause: errorPrismaFileList,
    });
  }
  if (!prismaFileList) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'Prisma file list is empty, no file was created',
    });
  }
  return prismaFileList;
}
