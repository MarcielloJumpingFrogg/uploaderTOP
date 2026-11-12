import { resetDb, resetBuckets, logIn } from './functions';
import { beforeEach, expect, it, describe } from 'vitest';
import { app } from '@/app';
import request, { agent } from 'supertest';
import { prisma } from '../lib/prisma';
import logger from '../config/logger';
import { createPseudoFile } from './createPseudoFile';
import { createPseudoUser } from './createPseudoUser';
import type { pseudoUser } from './testTypes';
import { createShareSession } from '@/dbMethods/createShareSession';
import { createPseudoFolder } from './createPseudoFolder';
import { tryCatch } from '@/customErrors/tryCatch';
import { ProjectError } from '@/customErrors/ErrorBase';

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
});

describe('File shareSessin is expired, user shared with should not be able to see it', async () => {
  it('user that already has the session cant see the files anymore', async () => {
    const expiringSessionOwner: pseudoUser = {
      id: 'expiringSessionOwner',
      username: 'expiringSessionOwner',
    };

    await createPseudoUser(expiringSessionOwner);
    const ownerAgent = request.agent(app);
    await logIn(ownerAgent, expiringSessionOwner.username);

    const destinationExpiringSession: pseudoUser = {
      id: 'destinationExpiringSession',
      username: 'destinationExpiringSession',
    };
    await createPseudoUser(destinationExpiringSession);
    const destinationAgent = request.agent(app);
    await logIn(destinationAgent, destinationExpiringSession.username);

    const fileName = 'ShareSessionExpiringFile';
    await createPseudoFile(
      expiringSessionOwner.id,
      fileName,
      'txt',
      undefined,
      fileName,
    );

    const result = await createShareSession(
      expiringSessionOwner.id,
      fileName,
      1,
      true,
    );

    await destinationAgent.get(`/share/add/${result.id}`);

    const homeBefore = await destinationAgent.get('/account');
    expect(homeBefore.text).toContain(`<p>${fileName}</p>`);

    const past = Number(Date.now()) - 10000;
    const pastAsDate = new Date(past);

    const { data: resultEditingExpiration, error: errorEditingExpiration } =
      await tryCatch(
        prisma.shareSession.update({
          where: {
            id: result.id,
          },
          data: {
            expiration: pastAsDate.toISOString(),
          },
        }),
      );

    if (errorEditingExpiration) {
      throw new ProjectError({
        name: 'SERVER_ERROR',
        message: 'Error editing the expiration date',
        cause: errorEditingExpiration,
      });
    }

    if (!resultEditingExpiration) {
      throw new ProjectError({
        name: 'VARIABLE_IS_EMPTY',
        message: 'Could not edit expiration date',
      });
    }

    const homeAfter = await destinationAgent.get('/account');
    expect(homeAfter.text).not.toContain(`<p>${fileName}</p>`);

    const shareSession = await prisma.shareSession.findMany({
      where: {
        originalUser: expiringSessionOwner.id,
      },
    });
    expect(shareSession.length).toBe(0);
  });
});
