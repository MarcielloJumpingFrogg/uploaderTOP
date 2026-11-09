import { ProjectError } from '@/customErrors/ErrorBase';
import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';

export async function createShareSession(
  userId: string,
  fileId: string,
  expirationDay: number,
  canBeEdited: boolean,
) {
  const { data: shareSessionResult, error: shareSessionError } = await tryCatch(
    prisma.shareSession.create({
      data: {
        originalUser: userId,
        originalFile: fileId,
        expiration: new Date(expirationDay),
        edit: canBeEdited,
      },
    }),
  );

  if (shareSessionError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while creating the shareSession',
      cause: shareSessionError,
    });
  }

  if (!shareSessionResult) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message:
        'No shareSessionResult. Something went wrong during the creation of shareSession',
    });
  }
  return shareSessionResult;
}
