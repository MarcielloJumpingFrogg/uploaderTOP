import { prisma } from '../lib/prisma';
import { emptyBucket } from '../src/supabaseFn/emptyBucket';
import logger from '../config/logger';
import type request from 'supertest';
import { tryCatch } from '@/customErrors/tryCatch';
import { ProjectError } from '@/customErrors/ErrorBase';

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

const generalPassword = 'Password1234!';

// async function signUp(
//   agent: request.Agent,
//   creadentials: { username: string; password?: string },
// ) {
//   await agent
//     .post('/signUp')
//     .type('form')
//     .send({ username: creadentials.username, password: generalPassword });
//
//   const user = await agent.get('/api/user');
//   return user;
// }

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

async function uploadFile(
  agent: request.Agent,
  uploadName: string,
  parentFolder: string,
  fileToUpload: string,
) {
  return await agent
    .post('/account/file')
    .type('form')
    .field('newName', uploadName)
    .field('_location', parentFolder)
    .attach('usrFile', __dirname + '/testFiles/' + fileToUpload)
    .expect(302);
}

async function createFolder(
  agent: request.Agent,
  name: string,
  parentFolder: string,
) {
  agent
    .post('/account/newFolder')
    .type('form')
    .send({ _parentFolder: parentFolder, newFolderName: name, _owner: '0' });
}

async function shareFile(
  userId: string,
  params: {
    parentFolder: string;
    _fileId: string;
    canEdit?: string;
    daysExpiration?: number;
  },
) {
  const shareSession = await prisma.shareSession.findMany({
    where: {
      filePath: filePath,
      originalUser: userId,
      fileName: params._name,
    },
  });

  return { shareCreateResult, shareSession };
}

async function softReset() {
  await prisma.sharedFiles.deleteMany();
  await prisma.shareSession.deleteMany();
  await prisma.items.deleteMany();
  await resetBuckets();
}

export {
  resetDb,
  resetBuckets,
  logIn,
  uploadFile,
  shareFile,
  softReset,
  createFolder,
};
