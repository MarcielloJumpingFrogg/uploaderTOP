import { getAvatar } from '../supabaseFn/getAvatar';
import type { Request, Response } from 'express';
import customErrorContainer from '../customErrors/customErrorContainer';
import logger from '../../config/logger';
import { tryCatch } from '../customErrors/tryCatch';
import { getAllFiles } from '@/dbMethods/getAllFiles';
import { getUserAndOriginalFolderId } from '@/dbMethods/getUserAndOriginalFolderId';
import { prisma } from '@prisma';
import { ProjectError } from '@/customErrors/ErrorBase';
import { errorBehaviour } from '@/customErrors/errorBehaviour';
import { downloadFile } from '@/supabaseFn/downloadFile';

async function guestsDownload(req: Request, res: Response) {
  const { data: shareSession, error: shareSessionError } = await tryCatch(
    prisma.shareSession.findUnique({ where: { id: req.shareSessionTemp } }),
  );
  if (shareSessionError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while getting the files in the shareSessionTemp',
      cause: shareSessionError,
    });
  }

  const { data: item, error: itemError } = await tryCatch(
    prisma.items.findUnique({
      where: { id: shareSession?.originalFile },
    }),
  );
  if (itemError) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: 'Error while getting the files in the shareSessionTemp',
      cause: itemError,
    });
  }

  if (!item) {
    throw new ProjectError({
      name: 'VARIABLE_IS_EMPTY',
      message: 'Empty item from shareSession id of un-authenticated user',
    });
  }

  if (item.type == 'FOLDER') {
    customErrorContainer.inputError('Cannot download a folder');
    res.redirect('/');
    return;
  }

  await downloadFile(item, res);
}

async function renderAccount(req: Request, res: Response) {
  try {
    let requestUser;
    let userId: string = '';
    if (!req.user) {
      userId = '0';
    } else {
      userId = req.user.id;
    }

    requestUser = { id: userId, username: req.user?.username || 'Guest' };
    logger.test('requestUser: ', requestUser);
    const requestUserIsOwner = req.userIsOwner;
    const requestCurrentFolder = req.currentFolderId;

    let folderOwner: string = '';
    let userIsOwner: boolean = false;
    let originalFolderId: string = '';

    if (req.user) {
      const objectData = await getUserAndOriginalFolderId(
        userId,
        requestUserIsOwner,
        requestCurrentFolder,
      );

      folderOwner = objectData.userId;
      userIsOwner = objectData.userIsOwner;
      originalFolderId = objectData.originalFolderId;
    } else {
      await guestsDownload(req, res);
    }

    //refresh cookies {{{
    try {
      const month = 1000 * 60 * 60 * 24 * 30;
      req.session.cookie.maxAge = month;
    } catch (e) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'Could Not Update the cookies',
        cause: e,
      });
    }
    //}}}

    //avatar {{{
    const { data: avatar, error: avatarError } = await tryCatch(
      getAvatar(requestUser.id),
    );
    if (avatarError) throw new Error('error getting avatar: ', avatarError);
    //}}}

    //Getting all the files, both the originated by the user and the shared with {{{
    const { finalSharedFiles, ownedFiles } = await getAllFiles(
      folderOwner,
      originalFolderId,
      userIsOwner,
      requestUser.id,
      req.shareSessionTemp,
    );
    // }}}

    //Getting the parent folder, used for the creation of new folders and travel to the previous one: {{{
    let parentFolderId;
    const { data: orginalFolder, error: errorOriginalFolder } = await tryCatch(
      prisma.items.findUnique({ where: { id: originalFolderId } }),
    );
    if (errorOriginalFolder) {
      logger.error('Error getting originalFolder: ', errorOriginalFolder);
      customErrorContainer.genericError();
      res.redirect('/');
      return;
    }
    parentFolderId = orginalFolder?.parentFolderId || 'Home';
    //}}}

    let popUp = req.popUp || {};

    res.status(customErrorContainer.getErrorCode()).render('account', {
      //user and file data {{{
      user: requestUser,
      isOwner: userIsOwner,
      ownedFiles: ownedFiles,
      sharedFiles: finalSharedFiles,
      shareSessionTemp: req.shareSessionTemp,
      parentFolderId: parentFolderId,
      currentFolderId: req.currentFolderId || 'Home',
      avatar: avatar,
      popUp: popUp,

      //error management
      errorName: customErrorContainer.getErrorName(),
      errors: customErrorContainer.getErrorList(),
      //}}}
    });
    customErrorContainer.resetError();
  } catch (e) {
    errorBehaviour(e, res);
    return;
  }
}

const accountController = [
  async (req: any, res: Response) => {
    await renderAccount(req, res);
  },
];

export { accountController, renderAccount };
