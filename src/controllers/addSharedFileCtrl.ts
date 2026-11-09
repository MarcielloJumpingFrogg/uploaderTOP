import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import customErrorContainer from '../customErrors/customErrorContainer';
import logger from '../../config/logger';
import { tryCatch } from '@/customErrors/tryCatch';
import type { Items } from '../../generated/prisma/client';
import { createSharedFile } from '@/dbMethods/createSharedFile';
import { ProjectError } from '@/customErrors/ErrorBase';

async function getSubFiles(folder: string | undefined, currentList: Items[]) {
  if (folder == undefined) throw new Error('Folder is undefined');
  const { data: containedInFolder, error: errorGettingFilesInFolder } =
    await tryCatch(
      prisma.items.findMany({ where: { parentFolderId: folder } }),
    );
  if (errorGettingFilesInFolder)
    throw new Error('error getting the files in the folder');

  for (let i = 0; i < containedInFolder.length; i++) {
    if (containedInFolder[i]?.type === 'FOLDER') {
      if (!containedInFolder[i] || !containedInFolder) throw new Error('no id');
      if (containedInFolder[i]?.id != undefined) {
        const { data: recursionResult, error: errorRecursion } = await tryCatch(
          getSubFiles(containedInFolder[i]?.id, currentList),
        );
        if (errorRecursion) throw new Error('error in recursion');
        currentList = currentList.concat(recursionResult);
      }
    }
  }
  currentList = currentList.concat(containedInFolder);

  return currentList;
}

export const addSharedFileCtrl = [
  async (req: Request, res: Response) => {
    try {
      const shareId = req.params[`shareId`];
      if (!shareId || Array.isArray(shareId)) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'No shareId in addSharedFileCtrl',
        });
      }

      const shareSession = await prisma.shareSession.findUnique({
        where: {
          id: shareId,
        },
      });

      if (!shareSession) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'No ShareSession inside addSharedFileCtrl',
        });
      }

      if (!req.user) {
        throw new ProjectError({
          name: 'MISSING_USER',
          message: 'missing user inside addSharedFileCtrl',
        });
      }

      const { data: originalFile, error: err } = await tryCatch(
        prisma.items.findFirst({ where: { id: shareSession.originalFile } }),
      );
      if (err) {
        throw new ProjectError({
          name: 'SERVER_ERROR',
          message: 'Error getting the originalFile',
          cause: err,
        });
      }
      if (!originalFile) {
        throw new ProjectError({
          name: 'VARIABLE_IS_EMPTY',
          message: 'No original file from frindOriginalFile',
        });
      }

      let filesInFolder: Items[] = [];
      if (originalFile.type === 'FOLDER') {
        const { data: result, error } = await tryCatch(
          getSubFiles(originalFile.id, filesInFolder),
        );
        if (error)
          throw new ProjectError({
            name: 'SERVER_ERROR',
            message: 'Error while getting subFiles',
            cause: error,
          });
        filesInFolder = filesInFolder.concat(result);
      }
      filesInFolder.push(originalFile);
      //need to create the big folder // allegedly

      for (let i = 0; i < filesInFolder.length; i++) {
        await createSharedFile(filesInFolder[i], shareSession, req.user.id);
      }
    } catch (e) {
      logger.error(`Unhandled error caught: `, e);
      customErrorContainer.passportError(e, 400);
    }

    res.redirect(`/account`);
  },
];
