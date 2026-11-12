// import { admin_supabase } from "../../config/supabase";
import { recursiveDelete } from '../supabaseFn/recursiveDelete';
import type { Request, Response } from 'express';
import logger from '../../config/logger';
import { prisma } from '../../lib/prisma';
import customErrorContainer from '@/customErrors/customErrorContainer';
import { tryCatch } from '@/customErrors/tryCatch';
import type {
  Items,
  SharedFiles,
  ShareSession,
} from '../../generated/prisma/client';
import { ProjectError } from '@/customErrors/ErrorBase';
import { getRecursivePath } from '@/dbMethods/getRecursivePath';
import { findOwnedFile } from '@/dbMethods/findOwnedFile';
import { getOriginalFileFromSharedData } from '@/dbMethods/getOriginalFileFromSharedData';
import { getEditMode } from '@/dbMethods/getEditMode';
import { findCurrentSharedFiles } from '@/dbMethods/findCurrentSharedFiles';
import { getShareSessionFromSharedFile } from '@/dbMethods/getShareSessionFromSharedFile';

async function deleteFromDb(userId: string, folder: Items) {
  if (!folder || !folder.id) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'folder id is empty when deleting',
    });
  }
  //{{{
  const { data, error } = await tryCatch(
    prisma.items.delete({ where: { id: folder.id, ownerId: userId } }),
  );

  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error deleting inside the deleteFromDb',
      cause: error,
    });
  }

  logger.test('data: ', data);
  //}}}
}

async function deleteAllFilesWithShareSession(
  shareSession: ShareSession,
  userId: string,
) {
  const { data, error } = await tryCatch(
    prisma.sharedFiles.deleteMany({
      where: {
        sessionId: shareSession.id,
        destinationUser: userId,
      },
    }),
  );
  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'There was an error during deleteAllFilesWithShareSession',
      cause: error,
    });
  }

  if (!data) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'No files were deleted',
    });
  }
}

async function fileDelete(req: Request, res: Response) {
  if (!req.user) {
    customErrorContainer.userError(res);
    throw new ProjectError({
      name: 'MISSING_USER',
      message: 'The user is missing',
    });
  }
  const fileId: string = req.body._fileId;

  const isOwner: 'true' | 'false' = req.body._isOwner;
  const bodyParentFolder: string | null | undefined = req.body._parentFolder;

  if (!fileId) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'File id is empty inside fileDelete',
    });
  }

  let originalFile: Items | null = null;
  let sharedFile: SharedFiles | null = null;
  let shareSession: ShareSession | null = null;
  const deleteMode: 'Owner' | 'GuestWithPermission' | 'Guest' | 'session' =
    await getEditMode(isOwner, req.user.id, fileId);

  if (deleteMode == 'Owner') {
    originalFile = await findOwnedFile(req.user.id, bodyParentFolder, fileId);
  } else {
    sharedFile = await findCurrentSharedFiles(fileId, req.user.id);
    shareSession = await getShareSessionFromSharedFile(sharedFile);
  }

  if (deleteMode === 'GuestWithPermission') {
    if (!sharedFile || !shareSession)
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message:
          "sharedFile is empty before calling to get original file, this is never supposed to happen but typescript doesn't know",
      });
    originalFile = await getOriginalFileFromSharedData(
      sharedFile,
      shareSession,
    );
  }

  switch (deleteMode) {
    case 'GuestWithPermission':
    case 'Owner':
      if (!originalFile)
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'OriginalFile is empty in mode owner/guestWithPermission',
        });

      const recursivePath = await getRecursivePath(originalFile.id, []);

      recursivePath.push(originalFile);
      for (let i = 0; i < recursivePath.length; i++) {
        const path = recursivePath[i];
        if (!path)
          throw new ProjectError({
            name: 'VARIABLE_IS_EMPTY',
            message: 'Path is empty inside owner/guestWithPermission mode',
          });
        await recursiveDelete(
          `${originalFile.ownerId}/Storage/${path.id}`,
          'Files',
        );
      }
      await deleteFromDb(originalFile.ownerId, originalFile);
      break;
    case 'session':
      if (!shareSession)
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'ShareSession is empty when trying to delete the session',
        });
      await deleteAllFilesWithShareSession(shareSession, req.user.id);

      break;
    case 'Guest':
      customErrorContainer.inputError(
        'You cannot delete a file that is not yours',
      );
      break;
    default:
      const _unhandledCases: never = deleteMode;
      customErrorContainer.inputError(
        'Catch case, there appears to be a non handled error',
      );
      logger.error('Catch case, there appears to be a non handled error');
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: "THIS MESSAGE IS NOT SUPPOSED TO BE SEEN, IT'S A CATCHALL",
        cause: _unhandledCases,
      });
  }
}

export const fileDeleteController = [
  async (req: Request, res: Response) => {
    try {
      await fileDelete(req, res);
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
    res.redirect('/');
  },
];
