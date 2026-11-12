import { app } from '@/app';
import request from 'supertest';
import { it, describe, expect, beforeEach } from 'vitest';
import { resetDb, resetBuckets, logIn, getFileInFolder } from './functions';
import { prisma } from '../lib/prisma';
import type { pseudoUser } from './testTypes';
import { createPseudoUser } from './createPseudoUser';
import { createPseudoFile } from './createPseudoFile';
import { createPseudoFolder } from './createPseudoFolder';
import { createShareSession } from '@/dbMethods/createShareSession';

beforeEach(async () => {
  await resetBuckets();
  await resetDb();
});

describe('Owner renaming file', async () => {
  it('rename a simple file', async () => {
    const params: pseudoUser = {
      id: 'Owner renaming file',
      username: 'Owner renaming file',
    };

    await createPseudoUser(params);
    const agent = request.agent(app);
    await logIn(agent, params.username);

    const file = 'FileToBeRenamedByOwner';
    await createPseudoFile(params.id, file, 'txt', undefined, file);

    expect(
      (await prisma.items.findUnique({ where: { id: file } }))?.fileName,
    ).toBe(file);

    const newName = 'RenamedFile';
    await agent.post('/account/rename').type('form').send({
      _isOwner: 'true',
      _fileId: file,
      _parentFolder: 'Home',
      newName: newName,
    });

    expect(
      (await prisma.items.findUnique({ where: { id: file } }))?.fileName,
    ).toBe(newName);
  });

  it('Rename a file in a folder', async () => {
    const params: pseudoUser = {
      id: 'Owner of rename inside folder',
      username: 'Owner of rename inside folder',
    };

    await createPseudoUser(params);
    const agent = request.agent(app);
    await logIn(agent, params.username);

    const folder = 'Folder containing file to be renamed';
    await createPseudoFolder(params.id, folder, undefined, folder);

    const file = 'File renamed inside folder';
    await createPseudoFile(params.id, file, 'txt', folder, file);

    expect(
      (await prisma.items.findUnique({ where: { id: file } }))?.fileName,
    ).toBe(file);

    const newName = 'File inside folder was renamed';
    await agent.post('/account/rename').type('form').send({
      _isOwner: 'true',
      _fileId: file,
      _parentFolder: folder,
      newName: newName,
    });

    expect(
      (await prisma.items.findUnique({ where: { id: file } }))?.fileName,
    ).toBe(newName);
  });

  it('Rename a folder ', async () => {
    const params: pseudoUser = {
      id: 'Owner of rename folder',
      username: 'Owner of rename folder',
    };

    await createPseudoUser(params);
    const agent = request.agent(app);
    await logIn(agent, params.username);

    const folder = 'Folder to be renamed';
    await createPseudoFolder(params.id, folder, undefined, folder);

    const file = 'File inside renamed folder';
    await createPseudoFile(params.id, file, 'txt', folder, file);

    expect(
      (await prisma.items.findUnique({ where: { id: folder } }))?.fileName,
    ).toBe(folder);

    const newName = 'Folder that was renamed';
    await agent.post('/account/rename').type('form').send({
      _isOwner: 'true',
      _fileId: folder,
      _parentFolder: 'Home',
      newName: newName,
    });

    expect(
      (await prisma.items.findUnique({ where: { id: folder } }))?.fileName,
    ).toBe(newName);
  });
});

describe('Renaming and shared compatibility', async () => {
  it('Renaming sharedFile from session is not allowed', async () => {
    const ownerParams: pseudoUser = {
      id: 'Owner of sharedFile',
      username: 'Owner of sharedFile',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.id);

    const destinationParams: pseudoUser = {
      id: 'Destination of sharedFile',
      username: 'Destination of sharedFile',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.id);

    const file = 'File To Be Shared';
    await createPseudoFile(ownerParams.id, file, 'txt', undefined, file);
    const shareSession = await createShareSession(
      ownerParams.id,
      file,
      1,
      true,
    );

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const dbResult = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(dbResult.length).toBe(1);

    const newName = 'Should not change';
    await destinationAgent.post('/account/rename').type('form').send({
      _isOwner: 'false',
      _fileId: dbResult[0]!.id,
      _parentFolder: 'Home',
      newName: newName,
    });

    const fileNameAfterChange = await prisma.items.findUnique({
      where: { id: file },
    });

    expect(fileNameAfterChange?.fileName).not.toBe(newName);
    expect(fileNameAfterChange?.fileName).toBe(file);

    const homePageAfter = await destinationAgent.get('/account');
    expect(homePageAfter.text).toContain(
      'You cannot modify this file, permission insufficient',
    );
  });

  it('Renaming a file in a folder with permission', async () => {
    const ownerParams: pseudoUser = {
      id: 'Owner of sharedFolder for rename',
      username: 'Owner of sharedFolder for rename',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.id);

    const destinationParams: pseudoUser = {
      id: 'Destination of sharedFolder for rename',
      username: 'Destination of sharedFolder for rename',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.id);

    const folder = 'Shared folder for rename';
    await createPseudoFolder(ownerParams.id, folder, undefined, folder);

    const file = 'File in folder, to be renamed';
    await createPseudoFile(ownerParams.id, file, 'txt', folder, file);
    const shareSession = await createShareSession(
      ownerParams.id,
      folder,
      1,
      true,
    );

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const dbResult = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(dbResult.length).toBe(2);

    const fileInFolder = getFileInFolder(dbResult, file);

    const newName = 'New name for file';
    await destinationAgent.post('/account/rename').type('form').send({
      _isOwner: 'false',
      _fileId: fileInFolder?.id,
      _parentFolder: folder,
      newName: newName,
    });

    const fileNameAfterChange = await prisma.items.findUnique({
      where: { id: file },
    });

    expect(fileNameAfterChange?.fileName).toBe(newName);
  });

  it('Cannot rename a file without permission', async () => {
    const ownerParams: pseudoUser = {
      id: 'Owner of shareFolder without permission',
      username: 'Owner of shareFolder without permission',
    };
    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.id);

    const destinationParams: pseudoUser = {
      id: 'Destination of shareFolder without permission',
      username: 'Destination of shareFolder without permission',
    };
    await createPseudoUser(destinationParams);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationParams.id);

    const folder = 'Shared folder without permission';
    await createPseudoFolder(ownerParams.id, folder, undefined, folder);

    const file = 'File in folder, cannot be renamed';
    await createPseudoFile(ownerParams.id, file, 'txt', folder, file);
    const shareSession = await createShareSession(
      ownerParams.id,
      folder,
      1,
      false,
    );

    await destinationAgent.get(`/share/add/${shareSession.id}`);

    const dbResult = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationParams.id,
      },
    });

    expect(dbResult.length).toBe(2);

    const fileInFolder = getFileInFolder(dbResult, file);

    const newName = 'Will not change';
    await destinationAgent.post('/account/rename').type('form').send({
      _isOwner: 'false',
      _fileId: fileInFolder?.id,
      _parentFolder: folder,
      newName: newName,
    });

    const fileNameAfterChange = await prisma.items.findUnique({
      where: { id: file },
    });

    expect(fileNameAfterChange?.fileName).not.toBe(newName);
    expect(fileNameAfterChange?.fileName).toBe(file);

    const homeAfterRename = await destinationAgent.get(`/account`);
    expect(homeAfterRename.text).toContain(
      'You cannot modify this file, permission insufficient',
    );
  });
});
