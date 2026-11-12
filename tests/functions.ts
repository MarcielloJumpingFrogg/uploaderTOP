import { prisma } from '../lib/prisma';
import { emptyBucket } from '../src/supabaseFn/emptyBucket';
import type request from 'supertest';
import { tryCatch } from '@/customErrors/tryCatch';
import { ProjectError } from '@/customErrors/ErrorBase';
import type { SharedFiles } from '../generated/prisma/client';

async function resetDb() {
  await prisma.$transaction([
    prisma.sharedFiles.deleteMany(),
    prisma.shareSession.deleteMany(),
    prisma.items.deleteMany(),
    prisma.users.deleteMany(),
    prisma.session.deleteMany(),
  ]);
}

async function resetBuckets() {
  const _resultAvatar = await emptyBucket('avatar');
  const _resultFiles = await emptyBucket('Files');
  return { _resultAvatar, _resultFiles };
}

export const generalPassword = 'Password1234!';
async function logIn(agent: request.Agent, username: string) {
  const { data, error } = await tryCatch(
    agent
      .post('/login')
      .type('form')
      .send({ username: username, password: generalPassword }),
  );

  if (error) {
    throw new ProjectError({
      name: 'SERVER_ERROR',
      message: `Error while logging in with user ${username}`,
      cause: error,
    });
  }

  return data;
}

async function softReset() {
  await prisma.sharedFiles.deleteMany();
  await prisma.shareSession.deleteMany();
  await prisma.items.deleteMany();
  await resetBuckets();
}

function getFileInFolder(sharedFiles: SharedFiles[], fileId: string) {
  for (let i = 0; i < sharedFiles.length; i++) {
    if (!sharedFiles[i]) return;
    const checkFile = sharedFiles[i];
    if (checkFile!.originalFile == fileId) return sharedFiles[i];
  }
}

export { getFileInFolder, resetDb, resetBuckets, logIn, softReset };
