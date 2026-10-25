import { app } from "../app";
import request from "supertest";
import { it, describe, expect } from "vitest";
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

describe("Controllig that rename works properly", async () => {
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
  const oldFileUploadName = `newFolder/${oldUniqueName}`;
  const fileToUpload = "textTest.txt";

  const secondName = "changedUniqueName";

  async function upload() {
    const uploadResult = await uploadFile(
      ownerAgent,
      oldFileUploadName,
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
    await rename(
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
    await rename(
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
    await upload();
    await fileRename(ownerAgent, oldUniqueName, secondName, "Home/newFolder");

    const firstPull = await ownerAgent.get("/account/0/Home@newFolder");

    expect(firstPull.text).toContain(`<p>${secondName}</p>`);
    await resetBuckets();
  });

  it("The owner can rename the folder: ", async () => {
    await upload();
    await folderRename(ownerAgent, "newFolder", secondName, "Home");
    const firstPull = await ownerAgent.get("/account");

    expect(firstPull.text).toContain(`<p>${secondName}</p>`);
    await resetBuckets();
  });

  it("user that has the file shared with will rename something inside the folder", async () => {
    // await upload();

    const uploadResult = await uploadFile(
      ownerAgent,
      "firstToBeChanged",
      "Home/someFolder",
      fileToUpload,
    );
    expect(uploadResult.statusCode).toBe(302);
    await shareFile(ownerAgent, {
      _location: "Home/someFolder",
      _fileType: "folder",
      _name: "firstToBeChanged",
      canEdit: "on",
      daysExpiration: 1,
    });

    const shareSession: any = await prisma.shareSession.findMany({
      where: { originalUser: ownerId, fileName: "firstToBeChanged" },
    });

    if (!shareSession) {
      throw new Error("No Share Session");
    }
    await sharedAgent.get("/share/add/" + shareSession[0].id);
    const sharedHomeBefore = await sharedAgent.get("/account");
    expect(sharedHomeBefore.text).toContain(`<p>firstToBeChanged</p>`);

    // const result =
    await sharedAgent.post("/account/rename").type("form").send({
      _location: "Home",
      _name: "firstToBeChanged",
      _type: "file",
      newName: "secondlyInserted",
      _sessionId: shareSession[0].id,
      _folderSession: "0",
    });
    const sharedHome = await sharedAgent.get("/account");
    expect(sharedHome.text).toContain(`<p>secondlyInserted</p>`);
    // expect(sharedHome.text).toContain(`<p>`);
  });

  it("a folder is shared and rename inside it ", async () => {});

  it("shared user cannot rename homeFolder", async () => {});

  it("owner changes name and sharedUser can see the new name", async () => {});
});
