import { app } from "../app";
import request from "supertest";
import { it, describe, expect, afterEach } from "vitest";
import {
  resetDb,
  resetBuckets,
  signUp,
  uploadFile,
  shareFile,
} from "./functions";
import { prisma } from "../lib/prisma";
import logger from "../config/logger";

await resetBuckets();
await resetDb();

async function softReset() {
  await prisma.sharedFiles.deleteMany();
  await prisma.shareSession.deleteMany();
  await prisma.files.deleteMany();
  await resetBuckets();
}

describe("Controllig that rename works properly", async () => {
  afterEach(async () => {
    await softReset();
  });
  const ownerParams = { username: "ownerRename" };
  const ownerAgent = request.agent(app);
  const sharedParams = { username: "sharedRename" };
  const sharedAgent = request.agent(app);

  await signUp(ownerAgent, ownerParams);
  await signUp(sharedAgent, sharedParams);

  const _apiOwner: any = await ownerAgent.get("/api/user");
  const ownerId = _apiOwner._body.user.id;
  const _apiShared: any = await sharedAgent.get("/api/user");
  const sharedId = _apiShared._body.user.id;

  const oldUniqueName = "fileToBeChanged.txt";
  const oldFolderName = "newFolder";
  const oldFileUploadName = `${oldFolderName}/${oldUniqueName}`;
  const fileToUpload = "textTest.txt";

  const secondName = "changedUniqueName";

  async function upload(fileName: string) {
    const uploadResult = await uploadFile(
      ownerAgent,
      fileName,
      "Home",
      fileToUpload,
    );
    expect(uploadResult.statusCode).toBe(302);
  }

  async function rename(
    agent: any,
    oldName: string,
    newName: string,
    location: string,
    type: string,
    sessionId?: string,
    folderSession?: string,
  ) {
    const result = await agent.post("/account/rename").type("form").send({
      _location: location,
      _name: oldName,
      _type: type,
      newName: newName,
      _sessionId: sessionId,
      _folderSession: folderSession,
    });
    return result;
  }

  async function fileRename(
    agent: any,
    oldName: string,
    newName: string,
    location: string,
    sessionId?: string,
    folderSession?: string,
  ) {
    return await rename(
      agent,
      oldName,
      newName,
      location,
      "file",
      sessionId,
      folderSession,
    );
  }

  async function folderRename(
    agent: any,
    oldName: string,
    newName: string,
    location: string,
    sessionId?: string,
    folderSession?: string,
  ) {
    return await rename(
      agent,
      oldName,
      newName,
      location,
      "folder",
      sessionId,
      folderSession,
    );
  }

  it("The owner of the file can rename it: ", async () => {
    await upload(oldFileUploadName);
    await fileRename(ownerAgent, oldUniqueName, secondName, "Home/newFolder");

    const firstPull = await ownerAgent.get("/account/0/Home@newFolder");

    expect(firstPull.text).toContain(`<p>${secondName}</p>`);
  });

  it("The owner can rename the folder: ", async () => {
    await upload(oldFileUploadName);
    await folderRename(ownerAgent, "newFolder", secondName, "Home");
    const firstPull = await ownerAgent.get("/account");

    expect(firstPull.text).toContain(`<p>${secondName}</p>`);
  });

  it("user that has the file shared with will rename something inside the folder", async () => {
    await upload(oldFileUploadName);
    const { shareSession } = await shareFile(ownerAgent, {
      _location: `Home/${oldFolderName}`,
      _fileType: "file",
      _name: oldUniqueName,
      canEdit: "on",
      daysExpiration: 1,
    });

    await sharedAgent.get("/share/add/" + shareSession[0].id);
    const sharedHomeBefore = await sharedAgent.get("/account");
    expect(sharedHomeBefore.text).toContain(`<p>${oldUniqueName}</p>`);

    await fileRename(
      sharedAgent,
      oldUniqueName,
      secondName,
      "Home",
      shareSession[0].id,
      "0",
    );
    const sharedHome = await sharedAgent.get("/account");
    expect(sharedHome.text).toContain(`<p>${secondName}</p>`);

    expect(
      (await ownerAgent.get(`/account/0/Home@${oldFolderName}`)).text,
    ).toContain(`<p>${secondName}</p>`);
  });

  it("Shared file cannot be edited", async () => {
    await upload(oldFileUploadName);
    const { shareSession } = await shareFile(ownerAgent, {
      _location: `Home/${oldFolderName}`,
      _fileType: "file",
      _name: oldUniqueName,
      canEdit: "off",
      daysExpiration: 1,
    });

    await sharedAgent.get("/share/add/" + shareSession[0].id);
    const sharedHome = await sharedAgent.get("/account");
    expect(sharedHome.text).toContain(`<p>${oldUniqueName}</p>`);

    const result = await fileRename(
      sharedAgent,
      oldUniqueName,
      secondName,
      "Home",
      shareSession[0].id,
    );

    expect(result.status).toBe(302);
    const postTry = await sharedAgent.get("/account");
    expect(postTry.text).toContain(`<p>${oldUniqueName}</p>`);
  });

  it("a folder is shared and rename inside it ", async () => {
    await upload(oldFileUploadName);
    const { shareSession } = await shareFile(ownerAgent, {
      _location: `Home`,
      _fileType: "folder",
      _name: oldFolderName,
      canEdit: "on",
      daysExpiration: 1,
    });

    await sharedAgent.get("/share/add/" + shareSession[0].id);
    expect((await sharedAgent.get("/account")).text).toContain(
      `<p>${oldFolderName}</p>`,
    );

    await fileRename(
      sharedAgent,
      oldUniqueName,
      secondName,
      `Home/${oldFolderName}`,
      "0",
      shareSession[0].id,
    );

    expect(
      (
        await sharedAgent.get(
          `/account/${shareSession[0].id}/Home@${oldFolderName}`,
        )
      ).text,
    ).toContain(`<p>${secondName}</p>`);
  });

  it("shared user cannot rename homeFolder", async () => {});

  it("owner changes name and sharedUser can see the new name", async () => {});
});
