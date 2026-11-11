import { createFolder } from '../supabaseFn/createFolder';
import type { Request, Response } from 'express';
import logger from '../../config/logger';
import customErrorContainer from '@/customErrors/customErrorContainer';

const newFolderController = [
  async (req: Request, res: Response) => {
    try {
      const currentFolder: string = req.body._currentFolderId;
      if (!currentFolder) {
        logger.error('No currentFolder in req.body');
        customErrorContainer.inputError(
          'There has been and error with your request',
        );
        res.redirect('/');
        return;
      }
      const newFolderName = req.body.folderName;
      if (!newFolderName) {
        logger.error('No New folder name in req.body');
        customErrorContainer.inputError(
          'Your need to specify a name for your new folder',
        );
        res.redirect('/');
        return;
      }
      const owner = req.body._isOwner;
      if (!owner) {
        logger.error('No owner in req.body');
        customErrorContainer.inputError(
          'There has been and error with your request',
        );
        res.redirect('/');
        return;
      }

      // const fullPath = req.user.id + "/" + location + "/" + req.body.folderName;
      await createFolder(
        owner,
        req,
        res,
        currentFolder,
        newFolderName,
        'Files',
      );
      const ownerRedirect = owner ? '0' : '1';
      res.redirect(`/account/${ownerRedirect}/${currentFolder}`);
    } catch (e) {
      logger.error('e', e);
    }
  },
];

export { newFolderController };
