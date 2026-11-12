import type { Request, Response } from 'express';
import { admin_supabase } from '../../config/supabase';
import logger from '../../config/logger';
import { ProjectError } from '@/customErrors/ErrorBase';
import { checkAll } from '@/functions/checkAll';
import { errorBehaviour } from '@/customErrors/errorBehaviour';
import { findCurrentSharedFiles } from '@/dbMethods/findCurrentSharedFiles';
import type { Items } from '../../generated/prisma/client';
import { getFileFromId } from '@/dbMethods/getFileFromId';

export const downloadController = [
  async (req: Request, res: Response) => {
    try {
      const fileId: string = req.body._fileId;
      const isOwner: 'true' | 'false' = req.body._isOwner;
      const parentFolder: string = req.body._parentFolder;
      checkAll(fileId, isOwner, parentFolder);
      if (!req.user) {
        throw new ProjectError({
          name: 'MISSING_USER',
          message: 'User missing in download controller',
        });
      }
      const userId = req.user.id;

      let originalFile: Items | undefined = undefined;
      let ogFileId: string = '';
      if (isOwner != 'true') {
        ogFileId = (await findCurrentSharedFiles(fileId, userId)).id;
      } else {
        ogFileId = fileId;
      }

      originalFile = await getFileFromId(ogFileId);

      if (originalFile.type == 'FOLDER') {
        throw new ProjectError({
          name: 'VARIABLE_IS_NOT_VALID_TYPE',
          message: 'Cannot download a folder',
        });
      }

      const testFile = `${originalFile.ownerId}/Storage/${originalFile.parentFolderId}/${originalFile.id}`;

      const { data, error } = await admin_supabase.storage
        .from('Files')
        .download(testFile);

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
    } catch (error: unknown) {
      errorBehaviour(error, res);
      res.redirect('/');
      return;
    }
  },
];
