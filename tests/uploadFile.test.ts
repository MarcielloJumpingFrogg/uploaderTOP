import request from 'supertest';
import { app } from '@/app';
import { describe, it, expect, beforeEach } from 'vitest';
import { logIn, resetDb } from './functions';
import type { pseudoUser } from './testTypes';
import { createPseudoUser } from './createPseudoUser';
import { prisma } from '@prisma';
import 'dotenv/config';

beforeEach(async () => {
  await resetDb();
});

describe('Uploading a file', async () => {
  it('Uploading a working file to the server', async () => {
    const simpleUploadUser: pseudoUser = {
      id: 'simpleUploadUser',
      username: 'simpleUploadUser',
    };

    const result = await createPseudoUser(simpleUploadUser);
    expect(result).not.toBe(undefined);
    const agent = request.agent(app);

    await logIn(agent, simpleUploadUser.username);

    await agent
      .post('/account/file')
      .attach('usrFile', __dirname + '/testFiles/textTest.txt')
      .expect(302);

    const firstUpload = await agent.get('/account');

    expect(firstUpload.text).toContain(`<p>textTest.txt</p>`);

    await agent
      .post('/account/file')
      .field('newName', 'NewNameForFile')
      .attach('usrFile', __dirname + '/testFiles/textTest.txt')
      .expect(302);

    const secondUpload = await agent.get('/account');

    expect(secondUpload.text).toContain(`<p>NewNameForFile</p>`);
    expect(secondUpload.text).toContain(`<p>textTest.txt</p>`);
  });

  it('Uploading a file thats too big', async () => {
    const uploadFileTooBig: pseudoUser = {
      id: 'uploadFileTooBig',
      username: 'uploadFileTooBig',
    };

    const result = await createPseudoUser(uploadFileTooBig);
    expect(result).not.toBe(undefined);
    const agent = request.agent(app);

    await logIn(agent, uploadFileTooBig.username);

    const uploadResult = await agent
      .post('/account/file')
      .attach('usrFile', __dirname + '/testFiles/imageTooBig.png')
      .expect(400);

    expect(uploadResult.text).toContain('<p class="error">File too large</p>');

    const dbResult = await prisma.items.findMany({
      where: {
        ownerId: uploadFileTooBig.id,
      },
    });

    expect(dbResult.length).toBe(0);
  });
});
