import { app } from '@/app';
import request from 'supertest';
import { it, describe, expect, beforeEach } from 'vitest';
import { resetDb, resetBuckets, logIn } from './functions';
import { prisma } from '../lib/prisma';
import type { pseudoUser } from './testTypes';
import { createPseudoUser } from './createPseudoUser';
import { createPseudoFolder } from './createPseudoFolder';
import logger from '../config/logger';
import { log } from 'console';
import { createShareSession } from '@/dbMethods/createShareSession';
import { promisify } from 'util';

beforeEach(async () => {
  await resetBuckets();
  await resetDb();
});

describe('Downloading files', async () => {
  it('Download a txt', async () => {
    const params: pseudoUser = {
      id: 'TxtDownload',
      username: 'TxtDownload',
    };

    await createPseudoUser(params);
    const agent = request.agent(app);
    await logIn(agent, params.username);

    const file = 'FileToBeDownloaded';
    await agent
      .post('/account/file')
      .field('newName', file)
      .field('_isOwner', 'true')
      .attach('usrFile', __dirname + '/testFiles/textTest.txt')
      .expect(302);

    const fileItem = await prisma.items.findMany({
      where: { ownerId: params.id },
    });
    expect(fileItem.length).toBe(1);

    const response = await agent.post('/account/download').send({
      _isOwner: 'true',
      _parentFolder: 'Home',
      _fileId: fileItem[0]?.id,
    });

    expect(response.header['content-type']).toBe(
      `${fileItem[0]?.mimetype}; charset=utf-8`,
    );
    expect(response.header['content-disposition']).toContain(`${file}`);
  });
  it('Download an image', async () => {
    const params: pseudoUser = {
      id: 'imgDownload',
      username: 'imgDownload',
    };

    await createPseudoUser(params);
    const agent = request.agent(app);
    await logIn(agent, params.username);

    const file = 'imgToBeDownloaded';
    await agent
      .post('/account/file')
      .field('newName', file)
      .field('_isOwner', 'true')
      .attach('usrFile', __dirname + '/testFiles/avatar.jpg')
      .expect(302);

    const fileItem = await prisma.items.findMany({
      where: { ownerId: params.id },
    });
    expect(fileItem.length).toBe(1);

    const response = await agent.post('/account/download').send({
      _isOwner: 'true',
      _parentFolder: 'Home',
      _fileId: fileItem[0]?.id,
    });

    expect(response.header['content-type']).toBe(`${fileItem[0]?.mimetype}`);

    expect(response.header['content-disposition']).toContain(`${file}`);
  });
  it('Failing to download a folder', async () => {
    const params: pseudoUser = {
      id: 'FolderDownload',
      username: 'FolderDownload',
    };

    await createPseudoUser(params);
    const agent = request.agent(app);
    await logIn(agent, params.username);

    const folder = 'FolderToNotBeDownloaded';
    await createPseudoFolder(params.id, folder, undefined, folder);

    const fileItem = await prisma.items.findMany({
      where: { ownerId: params.id },
    });
    expect(fileItem.length).toBe(1);

    logger.toImplement('Expected error: ');
    await agent.post('/account/download').send({
      _isOwner: 'true',
      _parentFolder: 'Home',
      _fileId: folder,
    });

    const homePage = await agent.get('/account');
    expect(homePage.text).toContain(
      'There was an unexpected error, You cannot download a folder',
    );
  });

  it('Downloading shared file', async () => {
    const ownerParams: pseudoUser = {
      id: 'ownerDownload',
      username: 'ownerDownload',
    };

    await createPseudoUser(ownerParams);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, ownerParams.username);

    const destinationUser: pseudoUser = {
      id: 'DestinationDownload',
      username: 'DestinationDownload',
    };
    await createPseudoUser(destinationUser);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationUser.username);

    const file = 'fileSharedForDownload';
    await ownerAgent
      .post('/account/file')
      .field('newName', file)
      .field('_isOwner', 'true')
      .attach('usrFile', __dirname + '/testFiles/avatar.jpg')
      .expect(302);

    const fileItem = await prisma.items.findMany({
      where: { ownerId: ownerParams.id },
    });
    expect(fileItem.length).toBe(1);

    const shareSession = await createShareSession(
      ownerParams.id,
      fileItem[0]!.id,
      1,
      true,
    );
    await destinationAgent.get(`/share/add/${shareSession.id}`);

    logger.test('shareSessiona; ', shareSession);

    const sharedFile = await prisma.sharedFiles.findMany({
      where: {
        destinationUser: destinationUser.id,
        originalFile: fileItem[0]?.id,
      },
    });

    logger.test('sharedFile:', sharedFile);
    expect(sharedFile.length).toBe(1);

    const response = await destinationAgent.post('/account/download').send({
      _isOwner: 'false',
      _parentFolder: 'Home',
      _fileId: sharedFile[0]!.id,
    });

    // logger.test('what: ', response);
    expect(response.header['content-type']).toBe(`${fileItem[0]?.mimetype}`);

    expect(response.header['content-disposition']).toContain(`${file}`);
  });
});
