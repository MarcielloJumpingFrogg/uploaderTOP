import { admin_supabase } from '../../config/supabase';
import logger from '../../config/logger';
import { prisma } from '../../lib/prisma';
import { getFromCurrentFolderId } from '../dbMethods/getFromCurrentFolderId';
import { tryCatch } from '../customErrors/tryCatch';
import type { Request, Response } from 'express';
import customErrorContainer from '@/customErrors/customErrorContainer';

export async function createFolder(
  owner: boolean,
  req: Request,
  res: Response,
  bodyFolderId: string,
  newFolderName: string,
  bucket: string,
) {
  try {
    let currentFolderId: string = '';
    if (!req.user) {
      customErrorContainer.userError(res);
      return;
    }
    const user = req.user.id;

    //getting current folder's id {{{
    if (!owner) {
      const { data: currentFolder, error: errorCurrentFolder } = await tryCatch(
        getFromCurrentFolderId(bodyFolderId, !owner, user),
      );
      if (errorCurrentFolder || !currentFolder) {
        logger.error('Error: no currentFolder in createFolder function');
        customErrorContainer.genericError();
        res.redirect('/');
        return;
      }
      currentFolderId = currentFolder.id;
    } else {
      currentFolderId = bodyFolderId;
    }
    //}}}

    //creating folder {{{
    let folderParent: string | null = '';
    if (currentFolderId == 'Home') {
      folderParent = null;
    } else {
      folderParent = currentFolderId;
    }
    const { data: folderCreation, error: folderCreationError } = await tryCatch(
      prisma.items.create({
        data: {
          ownerId: user,
          parentFolderId: folderParent,
          fileName: newFolderName,
          type: 'FOLDER',
          fileType: 'folder',
          size: '-',
        },
      }),
    );
    if (folderCreationError) {
      logger.error('error creating the folder');
      customErrorContainer.genericError();
      res.redirect('/');
      return;
    }
    //}}}

    const name = `${user}/Storage/${folderCreation.id}`;
    const { data: creationResult, error: errorCreatingFolder } = await tryCatch(
      admin_supabase.storage
        .from(bucket)
        .upload(name + '/.emptyFolderPlaceholder', ''),
    ); //last argument empty because the file is empty, just a placeHolder for the folder
    if (errorCreatingFolder) {
      logger.error('could not create the folder');
      logger.toImplement(
        'need to delete the folder from the database as well, to make sure they are in sync',
      );
      customErrorContainer.genericError();
      res.redirect('/');
      return;
    }
  } catch (e: any) {
    logger.error('Error in createFolder: ', e);
  }
}
