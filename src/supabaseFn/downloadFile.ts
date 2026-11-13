import type { Items } from '../../generated/prisma/client';
import { admin_supabase } from '../../config/supabase';
import { ProjectError } from '@/customErrors/ErrorBase';
import type { Response } from 'express';

export async function downloadFile(originalFile: Items, res: Response) {
  const downloadString = `${originalFile.ownerId}/Storage/${originalFile.parentFolderId}/${originalFile.id}`;

  const { data, error } = await admin_supabase.storage
    .from('Files')
    .download(downloadString);

  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error getting the file for the download',
      cause: error,
    });
  }

  if (!data) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'No buffer from supabase download',
    });
  }
  const buffer = Buffer.from(await data.arrayBuffer());

  let nameWithExtension: string = '';
  if (!originalFile.mimetype || originalFile.mimetype == 'text/plain') {
    nameWithExtension = `${originalFile.fileName}.${originalFile.fileType}`;
  } else {
    nameWithExtension = originalFile.fileName;
  }

  res.set({
    'Content-Type': `${originalFile.mimetype}`,
    'Content-Disposition': `attachment; filename=${nameWithExtension}`,
  });

  res.end(buffer);
}
