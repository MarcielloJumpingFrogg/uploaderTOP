import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '../../lib/prisma';
import type { Items } from '../../generated/prisma/client';
import { ProjectError } from '@/customErrors/ErrorBase';

export async function getOwnedFiles(
  userId: string,
  currentFolderId: string | null,
  userIsOwner: boolean,
): Promise<Items[] | [] | null> {
  if (userIsOwner) {
    let parentFolderId = currentFolderId == 'Home' ? null : currentFolderId;

    const { data: result, error: err } = await tryCatch(
      prisma.items.findMany({
        where: { ownerId: userId, parentFolderId: parentFolderId },
      }),
    );

    if (err) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'Error getting the files owned by the user',
        cause: err,
      });
    }
    return result;
  } else {
    return [];
  }
}
