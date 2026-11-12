import { createFolder } from '../supabaseFn/createFolder';
import type { Request, Response } from 'express';
import logger from '../../config/logger';
import customErrorContainer from '@/customErrors/customErrorContainer';
import { updateInSharedFolders } from '@/dbMethods/updateInSharedFolders';
import { ProjectError } from '@/customErrors/ErrorBase';

const newFolderController = [
  async (req: Request, res: Response) => {
    try {
      const currentFolder: string = req.body._currentFolderId;
      if (!currentFolder) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'missing _currentFolderId in newFolderController',
        });
      }
      const newFolderName = req.body.folderName;
      if (!newFolderName) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'Missing folderName in request',
        });
      }
      const isOwner = req.body._isOwner;
      if (!isOwner) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'Missing _isOwner in request',
        });
      }

      // const fullPath = req.user.id + "/" + location + "/" + req.body.folderName;
      const result = await createFolder(
        isOwner,
        req,
        res,
        currentFolder,
        newFolderName,
        'Files',
      );
      if (result) {
        await updateInSharedFolders(result);
      }
      const isOwnerRedirect = isOwner ? '0' : '1';
      res.redirect(`/account/${isOwnerRedirect}/${currentFolder}`);
    } catch (e) {
      logger.error('e', e);
    }
  },
];

export { newFolderController };
