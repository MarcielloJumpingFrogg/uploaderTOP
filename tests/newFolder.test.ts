import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '@/app';
import request from 'supertest';
import type { pseudoUser } from './testTypes';
import { createPseudoUser } from './createPseudoUser';
import { logIn, resetBuckets, resetDb } from './functions';
import { prisma } from '@prisma';
import { createPseudoFolder } from './createPseudoFolder';

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
});

describe('Testing the functionality of folders: ', async () => {
  it('User creates a new folder', async () => {
    const createFolderUser: pseudoUser = {
      id: 'createFolderUser',
      username: 'createFolderUSer',
    };
    const folderName = 'NewFolder for creteFolderUser';

    await createPseudoUser(createFolderUser);
    const agent = request.agent(app);
    await logIn(agent, createFolderUser.username);

    await agent.post('/account/newFolder').type('form').send({
      _isOwner: 'true',
      _currentFolderId: 'Home',
      folderName: folderName,
    });

    const homePage = await agent.get('/account');

    expect(homePage.text).contains(`<p>${folderName}</p>`);

    const dbPull = await prisma.items.findMany({
      where: {
        ownerId: createFolderUser.id,
        type: 'FOLDER',
        fileName: folderName,
        parentFolderId: null,
      },
    });

    expect(dbPull.length).toBe(1);
  });

  it('Create a folder inside the first Folder', async () => {
    const doubleFolderUser: pseudoUser = {
      id: 'doubleFolderUser',
      username: 'doubleFolderUser',
    };
    const folderName = 'NewFolder for creteFolderUser';

    await createPseudoUser(doubleFolderUser);
    const agent = request.agent(app);
    await logIn(agent, doubleFolderUser.username);

    await agent.post('/account/newFolder').type('form').send({
      _isOwner: 'true',
      _currentFolderId: 'Home',
      folderName: folderName,
    });

    const homePage = await agent.get('/account');

    expect(homePage.text).contains(`<p>${folderName}</p>`);

    const dbPull = await prisma.items.findMany({
      where: {
        ownerId: doubleFolderUser.id,
        type: 'FOLDER',
        fileName: folderName,
        parentFolderId: null,
      },
    });

    expect(dbPull.length).toBe(1);

    const secondFolderName = 'New Folder Inside First Folder';
    await agent.post('/account/newFolder').type('form').send({
      _isOwner: 'true',
      _currentFolderId: dbPull[0]?.id,
      folderName: secondFolderName,
    });

    const secondDbPull = await prisma.items.findMany({
      where: {
        ownerId: doubleFolderUser.id,
        type: 'FOLDER',
      },
    });

    expect(secondDbPull.length).toBe(2);

    const folderPage = await agent.get(`/account/0/${dbPull[0]?.id}`);
    expect(folderPage.text).toContain(`<p>${secondFolderName}</p>`);
  });

  it('Upload a file in folder', async () => {
    const newFileInFolderUser: pseudoUser = {
      id: 'newFileInFolderUser',
      username: 'newFileInFolderUser',
    };
    const folderName = 'NewFolder for file in folder';

    await createPseudoUser(newFileInFolderUser);
    const agent = request.agent(app);
    await logIn(agent, newFileInFolderUser.username);

    await agent.post('/account/newFolder').type('form').send({
      _isOwner: 'true',
      _currentFolderId: 'Home',
      folderName: folderName,
    });
    const dbPull = await prisma.items.findMany({
      where: {
        ownerId: newFileInFolderUser.id,
        type: 'FOLDER',
        fileName: folderName,
        parentFolderId: null,
      },
    });

    expect(dbPull.length).toBe(1);

    const fileName = 'FileInFolder';
    await agent
      .post('/account/file')
      .field('newName', fileName)
      .field('_isOwner', 'true')
      .field('_currentFolderId', dbPull[0]?.id || 'Home')
      .attach('usrFile', __dirname + '/testFiles/textTest.txt')
      .expect(302);

    const inFolderFile = await agent.get(`/account/0/${dbPull[0]?.id}`);

    expect(inFolderFile.text).toContain(`<p>${fileName}</p>`);
  });

  it('Create folder using pseudoFolder Function', async () => {
    const newUserWithPseudoFolder: pseudoUser = {
      id: 'newUserWithPseudoFolder',
      username: 'newUserWithPseudoFolder',
    };
    const folderName = 'New PseudoFolder';

    await createPseudoUser(newUserWithPseudoFolder);
    const agent = request.agent(app);
    await logIn(agent, newUserWithPseudoFolder.username);

    const newFolderId = 'ExpectedCustomId';
    await createPseudoFolder(
      newUserWithPseudoFolder.id,
      folderName,
      undefined,
      newFolderId,
    );

    const homePage = await agent.get('/account');

    expect(homePage.text).toContain(`<p>${folderName}</p>`);
  });

  it('Create a subPseudoFolder', async () => {
    const subPseudoFolderUser: pseudoUser = {
      id: 'subPseudoFolderUser',
      username: 'subPseudoFolderUser',
    };
    const folderName = 'ParentPseudoFolder';

    await createPseudoUser(subPseudoFolderUser);
    const agent = request.agent(app);
    await logIn(agent, subPseudoFolderUser.username);
    const newFolderId = 'ParentPseudoFolderId';
    await createPseudoFolder(
      subPseudoFolderUser.id,
      folderName,
      undefined,
      newFolderId,
    );

    const subFolderName = 'ChildPseudoFolder';
    const subFolderId = 'ChildPseudoFolderId';
    await createPseudoFolder(
      subPseudoFolderUser.id,
      subFolderName,
      newFolderId,
      subFolderId,
    );

    const homePage = await agent.get(`/account/0/${newFolderId}`);

    expect(homePage.text).toContain(`<p>${subFolderName}</p>`);
  });

  it('Upload a file in pseudoFolder', async () => {
    const fileInPseudoFolder: pseudoUser = {
      id: 'fileInPseudoFolder',
      username: 'fileInPseudoFolder',
    };
    const folderName = 'ParentPseudoFolder';

    await createPseudoUser(fileInPseudoFolder);
    const agent = request.agent(app);
    await logIn(agent, fileInPseudoFolder.username);

    const pseudoFolderId = 'ParentPseudoFolderId';
    await createPseudoFolder(
      fileInPseudoFolder.id,
      folderName,
      undefined,
      pseudoFolderId,
    );

    await agent
      .post('/account/file')
      .field('_isOwner', 'true')
      .field('_currentFolderId', pseudoFolderId)
      .attach('usrFile', __dirname + '/testFiles/textTest.txt')
      .expect(302);

    const folderView = await agent.get(`/account/0/${pseudoFolderId}`);

    expect(folderView.text).toContain(`<p>textTest.txt</p>`);
  });
});
