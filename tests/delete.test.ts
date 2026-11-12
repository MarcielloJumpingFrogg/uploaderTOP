import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '@/app';
import { resetBuckets, resetDb, logIn } from './functions';
import { prisma } from '../lib/prisma';
import { createPseudoUser } from './createPseudoUser';
import type { pseudoUser } from './testTypes';
import { createPseudoFile } from './createPseudoFile';
import { createPseudoFolder } from './createPseudoFolder';
import { createShareSession } from '@/dbMethods/createShareSession';
import logger from '../config/logger';
import type { SharedFiles } from '../generated/prisma/client';

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
});

function getFileInFolder(sharedFiles: SharedFiles[], fileId: string) {
  for (let i = 0; i < sharedFiles.length; i++) {
    if (!sharedFiles[i]) return;
    const checkFile = sharedFiles[i];
    if (checkFile!.originalFile == fileId) return sharedFiles[i];
  }
}

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
      id: 'DestinationOfDeleteSession',
      username: 'DestinationOfDeleteSession',
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

    const sharedFiles = await prisma.sharedFiles.findMany({
      where: { destinationUser: destinationParams.id },
    });

    expect(sharedFiles.length).toBe(1);

    const destinationPreDelete = await destinationAgent.get('/account');
    expect(destinationPreDelete.text).toContain(`<p>${file}</p>`);

    if (!sharedFiles[0]) {
      logger.error('No sharedFiles');
      return;
    }

    await destinationAgent
      .post('/account/delete')
      .send({
        _isOwner: 'false',
        _fileId: sharedFiles[0].id,
        _parentFolder: 'Home',
      })
      .expect(302);

    const postDeleteDb = await prisma.sharedFiles.findMany({
      where: { destinationUser: destinationParams.id },
    });

    expect(postDeleteDb.length).toBe(0);

    const ownerPage = await ownerAgent.get('/account');
    expect(ownerPage.text).toContain(`<p>${file}</p>`);

    const sharedPage = await destinationAgent.get('/account');
    expect(sharedPage.text).not.toContain(`<p>${file}</p>`);
  });

  it('Delete a file in a shared Folder', async () => {
    const ownerParams: pseudoUser = {
      id: 'OwnerOfDeleteInSharedFolder',
      username: 'OwnerOfDeleteInSharedFolder',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.username);

    const destinationParams: pseudoUser = {
      id: 'DestinationOfDeleteInSharedFolder',
      username: 'DestinationOfDeleteInSharedFolder',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.username);

    const folder = 'FolderWithSharedFiles';
    await createPseudoFolder(ownerParams.id, folder, undefined, folder);

    const file = 'fileInSharedFolder';
    await createPseudoFile(ownerParams.id, file, 'txt', folder, file);
    const shareSession = await createShareSession(
      ownerParams.id,
      folder,
      1,
      true,
    );

    if (!shareSession) {
      logger.error('No shareSession');
    }

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const sharedFiles = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(sharedFiles.length).toBe(2);

    const fileInFolder = getFileInFolder(sharedFiles, file);
    if (!fileInFolder) {
      logger.error('No file in folder');
      return;
    }
    await destinationAgent.post('/account/delete').type('form').send({
      _isOwner: 'false',
      _fileId: fileInFolder.id,
      _parentFolder: folder,
    });

    const postDeleteDb = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(postDeleteDb.length).toBe(1);

    const ownerDeleteDb = await prisma.items.findMany({
      where: {
        ownerId: ownerParams.id,
      },
    });

    expect(ownerDeleteDb.length).toBe(1);
  });

  it('Fail to delete file in a sharedFolder without permission', async () => {
    const ownerParams: pseudoUser = {
      id: 'OwnerOfDeleteWithoutPermission',
      username: 'OwnerOfDeleteWithoutPermission',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.username);

    const destinationParams: pseudoUser = {
      id: 'DestinationOfDeleteWithoutPermission',
      username: 'DestinationOfDeleteWithoutPermission',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.username);

    const folder = 'FolderWihtoutPermission';
    await createPseudoFolder(ownerParams.id, folder, undefined, folder);

    const file = 'FileCannotBeDeleted';
    await createPseudoFile(ownerParams.id, file, 'txt', folder, file);
    const shareSession = await createShareSession(
      ownerParams.id,
      folder,
      1,
      false,
    );

    if (!shareSession) {
      logger.error('No shareSession');
    }

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const sharedFiles = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(sharedFiles.length).toBe(2);

    const fileInFolder = getFileInFolder(sharedFiles, file);
    if (!fileInFolder) {
      logger.error('No file in folder');
      return;
    }
    await destinationAgent
      .post('/account/delete')
      .type('form')
      .send({
        _isOwner: 'false',
        _fileId: fileInFolder.id,
        _parentFolder: folder,
      })
      .expect(302);

    const homePage = await destinationAgent.get('/account');
    expect(homePage.text).toContain(
      'You cannot delete a file that is not yours',
    );

    const postDeleteDb = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(postDeleteDb.length).toBe(2);
  });
});
