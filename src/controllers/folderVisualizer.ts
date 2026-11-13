import { renderAccount } from './accountController';
import type { Request, Response } from 'express';
import logger from '../../config/logger';
import { ProjectError } from '@/customErrors/ErrorBase';

const folderVisualizer = [
  async (req: Request, res: Response) => {
    try {
      let folderId = req.params[`folderId`];
      const owned = req.params[`owned`];

      if (Array.isArray(owned)) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'Something weird',
        });
      }

      let userIsOwner;
      if (owned === '0') {
        userIsOwner = true;
      } else if (owned === '1') {
        userIsOwner = false;
      } else {
        userIsOwner = false;
        req.shareSessionTemp = owned;
      }
      if (!folderId || Array.isArray(folderId)) {
        folderId = 'Home';
      }
      req.currentFolderId = folderId;
      req.userIsOwner = userIsOwner;
      renderAccount(req, res);
    } catch (e) {
      logger.error(e);
    }
  },
];

export { folderVisualizer };
