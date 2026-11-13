import { app } from '@/app';
import request from 'supertest';
import { it, describe, expect, beforeEach } from 'vitest';
import { resetDb, resetBuckets, logIn } from './functions';
import { prisma } from '../lib/prisma';
import type { pseudoUser } from './testTypes';
import { createPseudoUser } from './createPseudoUser';
import { createShareSession } from '@/dbMethods/createShareSession';

beforeEach(async () => {
  await resetBuckets();
  await resetDb();
});

describe('Un-authenticated user sees the shared file', async () => {
  it('Simple file', async () => {
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
      .attach('usrFile', __dirname + '/testFiles/avatar.jpg')
      .expect(302);

    const fileItem = await prisma.items.findMany({
      where: { ownerId: params.id },
    });
    expect(fileItem.length).toBe(1);

    const result = await createShareSession(
      params.id,
      fileItem[0]!.id,
      1,
      true,
    );

    const shareSession = await prisma.shareSession.findMany({
      where: { id: result.id },
    });
    expect(shareSession.length).toBe(1);

    const guestAgent = request.agent(app);

    const guestHome = await guestAgent.get(`/share/add/${shareSession[0]!.id}`);

    expect(guestHome.header['content-type']).toBe('image/jpeg');

    expect(guestHome.header['content-disposition']).toContain(`${file}`);
  });
});
