import { prisma } from "../lib/prisma";
import { emptyBucket } from "../src/supabaseFn/emptyBucket";
import logger from "../config/logger";
import type request from "supertest";

async function resetDb() {
  await prisma.$transaction([
    prisma.sharedFiles.deleteMany(),
    prisma.shareSession.deleteMany(),
    prisma.files.deleteMany(),
    prisma.users.deleteMany(),
    prisma.session.deleteMany(),
  ]);
}

async function resetBuckets() {
  const _resultAvatar = await emptyBucket("avatar");
  const _resultFiles = await emptyBucket("Files");
}

const generalPassword = "Password1234!";

async function signUp(
  agent: request.Agent,
  creadentials: { username: string; password?: string },
) {
  await agent
    .post("/signUp")
    .type("form")
    .send({ username: creadentials.username, password: generalPassword });
}

async function uploadFile(
  agent: request.Agent,
  uploadName: string,
  location: string,
  fileToUpload: string,
) {
  return await agent
    .post("/account/file")
    .type("form")
    .field("newName", uploadName)
    .field("_location", location)
    .attach("usrFile", __dirname + "/testFiles/" + fileToUpload)
    .expect(302);
}

async function shareFile(
  agent: request.Agent,
  params: {
    _location: string;
    _fileType: string;
    _name: string;
    canEdit: string;
    daysExpiration: number;
  },
) {
  return await agent.post("/share/create").send(params).expect(200);
}

export { resetDb, resetBuckets, signUp, uploadFile, shareFile };
