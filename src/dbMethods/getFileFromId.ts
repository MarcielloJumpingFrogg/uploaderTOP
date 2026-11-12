import { ProjectError } from '@/customErrors/ErrorBase';
import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';

export async function getFileFromId(fileId: string) {
  const { data, error } = await tryCatch(
    prisma.items.findUnique({ where: { id: fileId } }),
  );

  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error getting the file from the id',
      cause: error,
    });
  }

  if (!data) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'No item could be found with given id',
    });
  }

  return data;
}
