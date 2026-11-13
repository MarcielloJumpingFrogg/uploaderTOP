import type { Request, Response } from 'express';
import { ProjectError } from '@/customErrors/ErrorBase';
import { checkAll } from '@/functions/checkAll';
import { errorBehaviour } from '@/customErrors/errorBehaviour';
import { findCurrentSharedFiles } from '@/dbMethods/findCurrentSharedFiles';
import type { Items } from '../../generated/prisma/client';
import { getFileFromId } from '@/dbMethods/getFileFromId';
import { downloadFile } from '@/supabaseFn/downloadFile';

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
        ogFileId = (await findCurrentSharedFiles(fileId, userId)).originalFile;
      } else {
        ogFileId = fileId;
      }

      originalFile = await getFileFromId(ogFileId);
      if (isOwner == 'true' && originalFile.ownerId !== req.user.id) {
        throw new ProjectError({
          name: 'SERVER_ERROR',
          message: 'Cannot download the file of another user',
        });
      }

      if (originalFile.type == 'FOLDER') {
        throw new ProjectError({
          name: 'VARIABLE_IS_NOT_VALID_TYPE',
          message: 'Cannot download a folder',
        });
      }
      await downloadFile(originalFile, res);
    } catch (error: unknown) {
      errorBehaviour(error, res);
      res.redirect('/');
      return;
    }
  },
];
