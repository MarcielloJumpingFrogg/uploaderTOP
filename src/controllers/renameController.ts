import type { Request, Response } from 'express';
import { ProjectError } from '@/customErrors/ErrorBase';
import { getEditMode } from '@/dbMethods/getEditMode';
import { findOwnedFile } from '@/dbMethods/findOwnedFile';
import type {
  Items,
  SharedFiles,
  ShareSession,
} from '../../generated/prisma/client';
import { getOriginalFileFromSharedData } from '@/dbMethods/getOriginalFileFromSharedData';
import { findCurrentSharedFiles } from '@/dbMethods/findCurrentSharedFiles';
import { getShareSessionFromSharedFile } from '@/dbMethods/getShareSessionFromSharedFile';
import { tryCatch } from '@/customErrors/tryCatch';
import { prisma } from '@prisma';
import customErrorContainer from '@/customErrors/customErrorContainer';
import { errorBehaviour } from '@/customErrors/errorBehaviour';
import { checkAll } from '@/functions/checkAll';

async function rename(mainFile: Items, newName: string) {
  const { data, error } = await tryCatch(
    prisma.items.update({
      where: {
        id: mainFile.id,
      },
      data: {
        fileName: newName,
      },
    }),
  );

  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while renaming file',
      cause: error,
    });
  }
  if (!data) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'No file was changed during rename',
    });
  }
}

async function renameFunction(req: Request) {
  const body = req.body;
  const fileId: string = body._fileId;
  const isOwner: 'true' | 'false' = body._isOwner;
  const parentFolder: string = body._parentFolder;
  const newName: string = body.newName;

  if (!newName) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'newName is empty',
    });
  }

  checkAll(fileId, isOwner, parentFolder);

  let mainFile: Items | null = null;

  if (!req.user)
    throw new ProjectError({
      name: 'MISSING_USER',
      message: 'Missing user in renameFunction',
    });

  const editMode: 'Owner' | 'GuestWithPermission' | 'Guest' | 'session' =
    await getEditMode(isOwner, req.user.id, fileId);

  let sharedFile: SharedFiles | null = null;
  let shareSession: ShareSession | null = null;
  if (editMode == 'Owner') {
    mainFile = await findOwnedFile(req.user.id, parentFolder, fileId);
  } else {
    sharedFile = await findCurrentSharedFiles(fileId, req.user.id);
    shareSession = await getShareSessionFromSharedFile(sharedFile);
  }

  if (editMode == 'GuestWithPermission') {
    if (!sharedFile || !shareSession) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'SharedFile or ShareSession are empty inside renameController',
      });
    }
    mainFile = await getOriginalFileFromSharedData(sharedFile, shareSession);
  }

  switch (editMode) {
    case 'GuestWithPermission':
    case 'Owner':
      if (!mainFile) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'MainFile is missing during owner/guestWithPermission visit',
        });
      }
      await rename(mainFile, newName);
      break;
    case 'Guest':
    case 'session':
      customErrorContainer.inputError(
        'You cannot modify this file, permission insufficient',
      );
      break;
    default:
      const _unhandledCase: never = editMode;
      customErrorContainer.inputError('Catch Case, something went wrong');
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'NOT ALL CASES FOR EDITMODE HAVE BEEN HANDLED',
        cause: _unhandledCase,
      });
  }
}

const renameController = [
  async (req: Request, res: Response) => {
    try {
      await renameFunction(req);
    } catch (error: unknown) {
      errorBehaviour(error, res);
      res.redirect('/');
      return;
    }
    res.redirect(`/account`);
  },
];

export { renameController };
