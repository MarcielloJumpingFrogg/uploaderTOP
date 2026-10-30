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
  const something = await agent
    .post("/signUp")
    .type("form")
    .send({ username: creadentials.username, password: generalPassword });

  const user = await agent.get("/api/user");
}

async function uploadFile(
  agent: request.Agent,
  uploadName: string,
  parentFolder: string,
  fileToUpload: string,
) {
  return await agent
    .post("/account/file")
    .type("form")
    .field("newName", uploadName)
    .field("_location", parentFolder)
    .attach("usrFile", __dirname + "/testFiles/" + fileToUpload)
    .expect(302);
}

async function createFolder(
  agent: request.Agent,
  name: string,
  parentFolder: string,
) {
  agent
    .post("/account/newFolder")
    .type("form")
    .send({ _parentFolder: "Home", newFolderName: name, _owner: "0" });
}

async function shareFile(
  agent: request.Agent,
  params: {
    _location: string;
    _fileType: string;
    _name: string;
    canEdit?: string;
    daysExpiration?: number;
  },
) {
  try {
    const shareCreateResult = await agent
      .post("/share/create")
      .send(params)
      .expect(200);

    const user: any = await agent.get("/api/user");
    const userId = user._body.user.id;
    const filePath = userId + "/" + params._location + "/";

    const shareSession = await prisma.shareSession.findMany({
      where: {
        filePath: filePath,
        originalUser: userId,
        fileName: params._name,
      },
    });
    if (!shareSession) {
      throw new Error("No share session");
    }

    return { shareCreateResult, shareSession };
  } catch (e) {
    logger.error("Error in shareFile: ", e);
  }
}

async function softReset() {
  await prisma.sharedFiles.deleteMany();
  await prisma.shareSession.deleteMany();
  await prisma.files.deleteMany();
  await resetBuckets();
}

export {
  resetDb,
  resetBuckets,
  signUp,
  uploadFile,
  shareFile,
  softReset,
  createFolder,
};
