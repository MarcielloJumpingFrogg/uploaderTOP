import { resetDb, resetBuckets, logIn } from './functions';
import { beforeEach, expect, it, describe } from 'vitest';
import { app } from '@/app';
import request from 'supertest';
import { prisma } from '../lib/prisma';
import logger from '../config/logger';
import { createPseudoFile } from './createPseudoFile';
import { createPseudoUser } from './createPseudoUser';
import type { pseudoUser } from './testTypes';
import { createShareSession } from '@/dbMethods/createShareSession';
import { createPseudoFolder } from './createPseudoFolder';

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
});

describe('Implementing the functionality of share', async () => {
  it('Create and share a file', async () => {
    const firstAgent = request.agent(app);
    const secondAgent = request.agent(app);
    const firstUserCredentials = {
      id: 'shareFileUser1',
      username: 'shareFileUser1',
    };
    const secondUserCredentials = {
      id: 'shareFileUser2',
      username: 'shareFileUser2',
    };

    await createPseudoUser(firstUserCredentials);
    await createPseudoUser(secondUserCredentials);

    await logIn(firstAgent, firstUserCredentials.username);

    await logIn(secondAgent, secondUserCredentials.username);

    const uniqueFileName = 'newFileForUniqueIdentification';
    const fileId = 'newFileForUniqueIdentificationId';
    const result = await createPseudoFile(
      firstUserCredentials.id,
      uniqueFileName,
      'txt',
      undefined,
      fileId,
    );
    if (!result) {
      logger.error('Could not create pseudoFile');
      return;
    }

    await firstAgent
      .post('/share/create')
      .send({
        daysExpiration: 1,
        canEdit: 'on',
        _fileId: fileId,
        _parentFolder: 'Home',
      })
      .expect(200);

    const shareSession = await prisma.shareSession.findMany({
      where: {
        originalUser: firstUserCredentials.id,
        originalFile: fileId,
      },
    });

    expect(shareSession.length).toBe(1);

    await secondAgent.get(`/share/add/${shareSession[0]?.id}`);

    const secondUserHome = await secondAgent.get('/account');
    expect(secondUserHome.text).toContain(`<p>${uniqueFileName}</p>`);
  });

  it('Share a folder with multiple files inside', async () => {
    const firstSharedFolderCredentials: pseudoUser = {
      id: 'firstSharedFolderCredentials',
      username: 'firstSharedFolderCredentials',
    };
    await createPseudoUser(firstSharedFolderCredentials);
    const firstAgent = request.agent(app);
    await logIn(firstAgent, firstSharedFolderCredentials.username);

    const secondSharedFolderCredentials: pseudoUser = {
      id: 'secondSharedFolderCredentials',
      username: 'secondSharedFolderCredentials',
    };
    await createPseudoUser(secondSharedFolderCredentials);
    const secondAgent = request.agent(app);
    await logIn(secondAgent, secondSharedFolderCredentials.username);

    const folder = 'folderToShare';
    const firstFile = 'firstFileInFolder';
    const secondFile = 'secondFileInFolder';

    await createPseudoFolder(
      firstSharedFolderCredentials.id,
      folder,
      undefined,
      folder,
    );
    await createPseudoFile(
      firstSharedFolderCredentials.id,
      firstFile,
      'txt',
      folder,
      firstFile,
    );
    await createPseudoFile(
      firstSharedFolderCredentials.id,
      secondFile,
      'txt',
      folder,
      secondFile,
    );

    const shareSessionResult = await createShareSession(
      firstSharedFolderCredentials.id,
      folder,
      1,
      true,
    );

    if (!shareSessionResult) {
      logger.error('no shareSession created');
      return;
    }

    await secondAgent.get(`/share/add/${shareSessionResult.id}`);

    const dbCheck = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: secondSharedFolderCredentials.id,
        sessionId: shareSessionResult.id,
      },
    });

    const testArray = [folder, firstFile, secondFile];
    for (let i = 0; i < dbCheck.length; i++) {
      expect(testArray).toContain(dbCheck[i]?.originalFile);
    }
  });
});
