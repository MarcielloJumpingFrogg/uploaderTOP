import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '@/app';
import { resetBuckets, resetDb, logIn, shareFile } from './functions';
import { prisma } from '../lib/prisma';
import { createPseudoUser } from './createPseudoUser';
import type { pseudoUser } from './testTypes';
import { createPseudoFile } from './createPseudoFile';
import { createPseudoFolder } from './createPseudoFolder';
import { createShareSession } from '@/dbMethods/createShareSession';
import logger from '../config/logger';

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
});

describe('Test Delete of files and folder of the owner', async () => {
  it('Create a file and then delete it: ', async () => {
    const deleteFile: pseudoUser = {
      id: 'uploadAndDeleteUser',
      username: 'uploadAndDeleteUser',
    };
    const agent = request.agent(app);
    await createPseudoUser(deleteFile);
    await logIn(agent, deleteFile.username);
    const fileToDelete = 'fileToDelete';

    await createPseudoFile(
      deleteFile.id,
      fileToDelete,
      'txt',
      undefined,
      fileToDelete,
    );

    const preDelete = await agent.get('/account');
    expect(preDelete.text).toContain(`${fileToDelete}`);

    const dbPreDelete = await prisma.items.findFirst({
      where: {
        ownerId: deleteFile.id,
      },
    });

    expect(dbPreDelete?.id).not.toBe(null);

    await agent.post('/account/delete').type('form').send({
      _isOwner: 'true',
      _fileId: fileToDelete,
      _parentFolder: 'Home',
    });

    const postDelete = await agent.get('/account');
    expect(postDelete.text).not.toContain(`${fileToDelete}`);

    const dbPostDelete = await prisma.items.findFirst({
      where: {
        ownerId: deleteFile.id,
      },
    });

    expect(dbPostDelete).toBe(null);
  });

  it('Create a folder with multiple files and delete them all ', async () => {
    const deleteFolder: pseudoUser = {
      id: 'UploadFolderAndDelete',
      username: 'UploadFolderAndDelete',
    };
    await createPseudoUser(deleteFolder);
    const agent = request.agent(app);
    await logIn(agent, deleteFolder.username);

    const folder = 'folderToDelete';
    const file = 'fileInsideFolderToDelete';
    const secondFile = 'secondFileInsideFolderToDelete';
    await createPseudoFolder(deleteFolder.id, folder, undefined, folder);
    await createPseudoFile(deleteFolder.id, file, 'txt', folder, file);
    await createPseudoFile(
      deleteFolder.id,
      secondFile,
      'txt',
      folder,
      secondFile,
    );

    const preDelete = await prisma.items.findMany({
      where: {
        ownerId: deleteFolder.id,
      },
    });
    expect(preDelete.length).toBe(3);

    await agent.post('/account/delete').type('form').send({
      _isOwner: 'true',
      _fileId: folder,
      _parentFolder: 'Home',
    });

    const postDelete = await prisma.items.findMany({
      where: {
        ownerId: deleteFolder.id,
      },
    });
    expect(postDelete.length).toBe(0);
  });

  it('Deleting only the file inside the folder', async () => {
    const deleteFileInFolder: pseudoUser = {
      id: 'deleteFileInFolder',
      username: 'deleteFileInFolder',
    };
    await createPseudoUser(deleteFileInFolder);
    const agent = request.agent(app);
    await logIn(agent, deleteFileInFolder.username);

    const folder = 'folderToKeep';
    const file = 'fileToDeleteInsideFolder';
    await createPseudoFolder(deleteFileInFolder.id, folder, undefined, folder);
    await createPseudoFile(deleteFileInFolder.id, file, 'txt', folder, file);

    const preDelete = await prisma.items.findMany({
      where: {
        ownerId: deleteFileInFolder.id,
      },
    });
    expect(preDelete.length).toBe(2);

    await agent.post('/account/delete').type('form').send({
      _isOwner: 'true',
      _fileId: file,
      _parentFolder: folder,
    });

    const postDelete = await prisma.items.findMany({
      where: {
        ownerId: deleteFileInFolder.id,
      },
    });
    expect(postDelete.length).toBe(1);
  });

  // it("Shared file get's removed upon deletion, but the sharer maintains it", async () => {
  //   const uploadResult = await uploadFile(
  //     ownerAgent,
  //     fileUploadName,
  //     'Home',
  //     fileToUpload,
  //   );
  //   expect(uploadResult.statusCode).toBe(302);
  //
  //   await shareFile(ownerAgent, {
  //     _location: 'Home',
  //     _fileType: 'txt',
  //     _name: uniqueName,
  //     canEdit: 'on',
  //     daysExpiration: 1,
  //   });
  //
  //   const shareSession = await prisma.shareSession.findFirst({
  //     where: { originalUser: ownerId, fileName: uniqueName },
  //   });
  //   if (!shareSession) {
  //     throw new Error('No Share Session');
  //   }
  //
  //   const preShareSharedHome = await sharedAgent.get('/account');
  //   expect(preShareSharedHome.text).toContain('<p>No files</p>');
  //
  //   await sharedAgent.get('/share/add/' + shareSession.id);
  //
  //   const postShareSharedHome = await sharedAgent.get('/account');
  //   expect(postShareSharedHome.text).toContain(`<p>${uniqueName}</p>`);
  //
  //   await deleteFile(sharedAgent, {
  //     _location: 'Home',
  //     _name: uniqueName,
  //     _type: 'txt',
  //     _sessionId: shareSession.id,
  //   });
  //   const postDeleteSharedHome = await sharedAgent.get('/account');
  //   expect(postDeleteSharedHome.text).toContain(`<p>No files</p>`);
  //
  //   const postDeleteOwner = await ownerAgent.get('/account');
  //   expect(postDeleteOwner.text).toContain('<p>newFolder</p>');
  //   const postDeleteOwnerFolder = await ownerAgent.get(
  //     '/account/0/Home@newFolder',
  //   );
  //   expect(postDeleteOwnerFolder.text).toContain(`<p>${uniqueName}</p>`);
  // });
});

describe('Deleting shared stuff', async () => {
  it('Destination user deletes the sharedFile, but the owner keeps it', async () => {
    const ownerParams: pseudoUser = {
      id: 'OwnerOfDeleteSession',
      username: 'OwnerOfDeleteSession',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.username);

    const destinationParams: pseudoUser = {
      id: 'DestinationOfDeleteSesion',
      username: 'DestinationOfDeleteSesion',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.username);

    const file = 'sharedFile';
    await createPseudoFile(ownerParams.id, file, 'txt', undefined, file);
    const shareSession = await createShareSession(
      ownerParams.id,
      file,
      1,
      true,
    );

    if (!shareSession) {
      logger.error('No shareSession');
    }

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const dbPull = await prisma.sharedFiles.findMany({
      where: { destinationUser: destinationParams.id },
    });

    logger.test('db:', dbPull);

    const destinationPreDelete = await destinationAgent.get('/account');
    expect(destinationPreDelete.text).toContain(`<p>${file}</p>`);

    destinationAgent.post('/account/delete').send({
      _isOwner: false,
      _fileId: shareSession.id,
      _parentFolder: 'Home',
    });

    const ownerPage = await ownerAgent.get('/account');
    expect(ownerPage.text).toContain(`<p>${file}</p>`);

    const sharedPage = await destinationAgent.get('/account');
    expect(sharedPage.text).not.toContain(`<p>${file}</p>`);
  });
});
