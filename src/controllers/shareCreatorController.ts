import type { Request, Response } from 'express';
import { renderAccount } from './accountController';
import { createShareSession } from '@/dbMethods/createShareSession';
import { ProjectError } from '@/customErrors/ErrorBase';
import { findOwnedFile } from '@/dbMethods/findOwnedFile';
import { errorBehaviour } from '@/customErrors/errorBehaviour';

export const shareCreatorController = [
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new ProjectError({
          name: 'MISSING_USER',
          message: 'No user found',
        });
      }

      let expiration = 1;
      if (req.body.daysExpiration) {
        expiration = req.body.daysExpiration;
      }
      const canBeEdited = req.body.canEdit === 'on' ? true : false;

      let parentFolder: string | null = req.body._parentFolder;
      const fileId: string = req.body._fileId;

      if (!fileId) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'File id is empty in createShareController',
        });
      }

      const originalFile = await findOwnedFile(
        req.user.id,
        parentFolder,
        fileId,
      );

      const shareSessionResult = await createShareSession(
        req.user.id,
        originalFile.id,
        expiration,
        canBeEdited,
      );

      req.popUp = {
        title: 'Url: ',
        text: 'http://localhost:8080/share/add/' + shareSessionResult.id,
      };
    } catch (error: unknown) {
      errorBehaviour(error, res);
      res.redirect('/');
      return;
    }
    renderAccount(req, res);
  },
];
