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

describe('Uploading a picture to user ', async () => {
  it('Upload and update the first users picture ', async () => {
    const simpleAvatarUploadUser: pseudoUser = {
      id: 'simpleAvatarUploadUser',
      username: 'simpleAvatarUploadUser',
    };

    const result = await createPseudoUser(simpleAvatarUploadUser);
    expect(result).not.toBe(undefined);
    const agent = request.agent(app);

    await logIn(agent, simpleAvatarUploadUser.username);

    await agent
      .post('/account/avatar')
      .attach('avatar', __dirname + '/testFiles/avatar.jpg')
      .expect(302);

    const db = await prisma.users.findUnique({
      where: { id: simpleAvatarUploadUser.id },
    });
    expect(db?.avatarVersion).toBe(1);

    await agent
      .post('/account/avatar')
      .attach('avatar', __dirname + '/testFiles/avatar.jpg')
      .expect(302);
    const db2 = await prisma.users.findUnique({
      where: { id: simpleAvatarUploadUser.id },
    });
    expect(db2?.avatarVersion).toBe(2);

    const accountPage = await agent.get('/account');

    expect(accountPage.text).toContain(
      `${process.env['TEST_SUPABASE_URL']}storage/v1/object/public/avatar/avatars/${simpleAvatarUploadUser.id}?cacheVersion=${db2?.avatarVersion}`,
    );
  });

  it('Uploading a non picture: ', async () => {
    const nonPictureAsAvatar: pseudoUser = {
      id: 'nonPictureAsAvatar',
      username: 'nonPictureAsAvatar',
    };

    const result = await createPseudoUser(nonPictureAsAvatar);
    expect(result).not.toBe(undefined);
    const agent = request.agent(app);

    await logIn(agent, nonPictureAsAvatar.username);

    const uploadResult = await agent
      .post('/account/avatar')
      .attach('avatar', __dirname + '/testFiles/textTest.txt')
      .expect(400);

    expect(uploadResult.text).toContain(
      '<p class="error">Supposed to Be image</p>',
    );
  });

  it('Uploading image too big: ', async () => {
    const imageTooBig: pseudoUser = {
      id: 'imageTooBig',
      username: 'imageTooBig',
    };

    const result = await createPseudoUser(imageTooBig);
    expect(result).not.toBe(undefined);
    const agent = request.agent(app);

    await logIn(agent, imageTooBig.username);

    const uploadResult = await agent
      .post('/account/avatar')
      .attach('avatar', __dirname + '/testFiles/imageTooBig.png')
      .expect(400);

    expect(uploadResult.text).toContain('<p class="error">File too large</p>');
  });
});
