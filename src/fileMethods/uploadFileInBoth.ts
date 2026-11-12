import { createDbEntry } from '@/dbMethods/createDbEntry';
import { tryCatch } from '@/customErrors/tryCatch';
import { uploadFile } from '@/supabaseFn/uploadFile';
import { ProjectError } from '@/customErrors/ErrorBase';
import { prisma } from '@prisma';

export async function uploadFileInBoth(
  itemsParams: {
    ownerId: string;
    fileName: string;
    fileType: string;
    size: string;
    parentFolderId: string | null;
  },
  file: Express.Multer.File,
) {
  const dbEntryResult = await createDbEntry(itemsParams);

  //Creating the file for supabaes and handling the error {{{
  const name = `${itemsParams.ownerId}/Storage/${itemsParams.parentFolderId}/${dbEntryResult.id}`;
  const { data: _uploadResult, error: uploadError } = await tryCatch(
    uploadFile(file, 'Files', name),
  );
  if (uploadError) {
    const { data: deleteResult, error: deleteError } = await tryCatch(
      prisma.items.delete({
        where: {
          id: dbEntryResult.id,
        },
      }),
    );

    if (deleteError) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'Could not delete prisma db entry of item',
        cause: deleteError,
      });
    }

    if (!deleteResult) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'No result from deleting db entry of item',
      });
    }

    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Could not complete uploadFile on supabase server',
      cause: uploadError,
    });
  }
  return dbEntryResult;
  //}}}
}
