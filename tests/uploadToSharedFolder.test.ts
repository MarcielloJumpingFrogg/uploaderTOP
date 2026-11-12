import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '@/app';
import logger from '../config/logger';
import { resetBuckets, resetDb, logIn, getFileInFolder } from './functions';
import { prisma } from '../lib/prisma';
import type { pseudoUser } from './testTypes';
import { createPseudoUser } from './createPseudoUser';
import { createPseudoFolder } from './createPseudoFolder';
import { createShareSession } from '@/dbMethods/createShareSession';
import { createPseudoFile } from './createPseudoFile';

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
});

describe('uploading to a sharedFolder', async () => {
  it('The owner uploads something and the sharedUser sees it', async () => {
    const ownerParams: pseudoUser = {
      id: 'Owner Uploads to shared folder',
      username: 'Owner Uploads to shared folder',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.username);

    const destinationParams: pseudoUser = {
      id: 'Destination for upload to sharedFolder',
      username: 'Destination for upload to sharedFolder',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.username);

    const folder = 'FolderToBeShared';
    await createPseudoFolder(ownerParams.id, folder, undefined, folder);
    const firstFile = 'FirstFileSharedInSession';
    await createPseudoFile(ownerParams.id, firstFile, 'txt', folder, firstFile);

    const shareSession = await createShareSession(
      ownerParams.id,
      folder,
      1,
      true,
    );

    if (!shareSession) {
      logger.error('No shareSession');
      return;
    }

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const preUploadDb = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(preUploadDb.length).toBe(2);

    const secondFile = 'SecondFileAfterShare';
    await ownerAgent
      .post('/account/file')
      .field('newName', secondFile)
      .field('_isOwner', 'true')
      .field('_currentFolderId', folder)
      .attach('usrFile', __dirname + '/testFiles/textTest.txt')
      .expect(302);

    const postUpload = await prisma.sharedFiles.findMany({
      where: { destinationUser: destinationParams.id },
    });
    expect(postUpload.length).toBe(3);
    const folderSharedFile = getFileInFolder(postUpload, folder);
    const inFolder = await destinationAgent.get(
      `/account/1/${folderSharedFile?.id}`,
    );
    expect(inFolder.text).toContain(`<p>${secondFile}</p>`);

    const secondFolder = 'SecondFolder in shareSession';
    await ownerAgent
      .post('/account/newFolder')
      .send({
        folderName: secondFolder,
        _isOwner: 'true',
        _currentFolderId: folder,
      })
      .expect(302);

    const postSecondUpload = await prisma.sharedFiles.findMany({
      where: { destinationUser: destinationParams.id },
    });
    expect(postSecondUpload.length).toBe(4);
    const afterSecondUpload = await destinationAgent.get(
      `/account/1/${folderSharedFile?.id}`,
    );
    expect(afterSecondUpload.text).toContain(`<p>${secondFolder}</p>`);
  });
});
