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

async function renderAccount(req: Request, res: Response) {
  try {
    //getting informations about the userId, the original folder id and if the user is also the owner: {{{
    if (!req.user) {
      throw new ProjectError({
        name: 'MISSING_USER',
        message: 'User Missing in renderAccount',
      });
    }

    const userId = req.user.id;
    const requestUserIsOwner = req.userIsOwner;
    const requestCurrentFolder = req.currentFolderId;
    const objectData = await getUserAndOriginalFolderId(
      userId,
      requestUserIsOwner,
      requestCurrentFolder,
    );

    //}}}
    const { userId: folderOwner, userIsOwner, originalFolderId } = objectData;

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
      getAvatar(req.user.id),
    );
    if (avatarError) throw new Error('error getting avatar: ', avatarError);
    //}}}

    //Getting all the files, both the originated by the user and the shared with {{{
    const { finalSharedFiles, ownedFiles } = await getAllFiles(
      folderOwner,
      originalFolderId,
      userIsOwner,
      req.user.id,
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
      user: req.user,
      isOwner: userIsOwner,
      ownedFiles: ownedFiles,
      sharedFiles: finalSharedFiles,
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
