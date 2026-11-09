import type { Request, Response } from 'express';
import logger from '../../config/logger';
import { renderAccount } from './accountController';
import customErrorContainer from '@/customErrors/customErrorContainer';
import { createShareSession } from '@/dbMethods/createShareSession';
import { ProjectError } from '@/customErrors/ErrorBase';
import { findOwnedFile } from '@/dbMethods/findOwnedFile';

export const shareCreatorController = [
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new ProjectError({
          name: 'MISSING_USER',
          message: 'No user found',
        });
      }

      const dayInMs = 24 * 60 * 60 * 1000;
      let expiration = 1;
      if (req.body.daysExpiration) {
        expiration = req.body.daysExpiration;
      }
      expiration = expiration * dayInMs;
      const expirationDay = Date.now() + expiration;

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
        expirationDay,
        canBeEdited,
      );

      req.popUp = {
        title: 'Url: ',
        text: 'http://localhost:8080/share/add/' + shareSessionResult.id,
      };
    } catch (error: unknown) {
      if (error instanceof ProjectError) {
        if (error.name == 'MISSING_USER') {
          customErrorContainer.userError(res);
          return;
        }
        if (error.name == 'VARIABLE_IS_EMPTY') {
          logger.error('VARIABLE_IS_EMPTY', error);
          customErrorContainer.genericError();
          res.redirect('/');
          return;
        }
        if (error.name == 'SERVER_ERROR') {
          logger.error('SERVER_ERROR COULD NOT COMPLETE: ', error);
          customErrorContainer.genericError();
          res.redirect('/');
          return;
        }
        const _unHandledCases: never = error.name;
        return _unHandledCases;
      }
      logger.error('UNEXPECTED ERROR: ', error);
    }
    renderAccount(req, res);
  },
];
