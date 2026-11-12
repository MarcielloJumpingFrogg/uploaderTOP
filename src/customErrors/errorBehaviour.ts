import type { Response } from 'express';
import { ProjectError } from './ErrorBase';
import customErrorContainer from './customErrorContainer';
import logger from '../../config/logger';

export function errorBehaviour(error: unknown, res: Response) {
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
    if (error.name == 'VARIABLE_IS_NOT_VALID_TYPE') {
      logger.error('VARIABLE IS OF UNEXPECTED TYPE: ', error);
      customErrorContainer.inputError(
        'There was an unexpected error, You cannot download a folder',
      );
      res.redirect('/');
      return;
    }
    const _unHandledCases: never = error.name;
    return _unHandledCases;
  }
  logger.error('UNEXPECTED ERROR: ', error);
}
