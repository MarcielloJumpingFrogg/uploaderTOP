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
import { SessionScalarFieldEnum } from "../generated/prisma/internal/prismaNamespace";
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

  const _apiOwner = await ownerAgent.get("/api/user");
  const ownerId = _apiOwner._body.user.id;
  const _apiShared = await sharedAgent.get("/api/user");
  const sharedId = _apiShared._body.user.id;

  const oldUniqueName = "fileToBeChanged.txt";
  const oldFileUploadName = `newFolder/${oldUniqueName}`;
  const fileToUpload = "textTest.txt";

  const secondName = "changedUniqueName";
  const thirdName = "againChangedUniqueNameForTheSecondTime";

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
    // await resetBuckets();
  });

  it("user that has the file shared with will rename something inside the folder", async () => {
    // await upload();

    const uploadResult = await uploadFile(
      ownerAgent,
      "firstToBeChanged",
      "Home",
      fileToUpload,
    );
    expect(uploadResult.statusCode).toBe(302);
    await shareFile(ownerAgent, {
      _location: "Home/newFolder",
      _fileType: "folder",
      _name: "firstToBeChanged",
      canEdit: "on",
      daysExpiration: 1,
    });

    const shareSession = await prisma.shareSession.findMany({
      where: { originalUser: ownerId, fileName: "firstToBeChanged" },
    });

    logger.test("shareSessions: ", shareSession);

    if (!shareSession) {
      throw new Error("No Share Session");
    }
    await sharedAgent.get("/share/add/" + shareSession[0].id);
    const sharedHomeBefore = await sharedAgent.get("/account");
    expect(sharedHomeBefore.text).toContain(`<p>firstToBeChanged</p>`);

    // await fileRename(
    //   sharedAgent,
    //   oldUniqueName,
    //   secondName,
    //   "Home",
    //   shareSession.id,
    //   "0",
    // );
    //
    console.log(
      "_location:     ",
      "Home",
      "_name:         ",
      oldUniqueName,
      "_type:         ",
      "file",
      "newName:       ",
      secondName,
      "_sessionId:    ",
      shareSession.id,
      "_folderSession:",
      "0",
    );

    const result = await sharedAgent.post("/account/rename").type("form").send({
      _location: "Home",
      _name: "firstToBeChanged",
      _type: "file",
      newName: "secondlyInserted",
      _sessionId: shareSession.id,
      _folderSession: "0",
    });
    const sharedHome = await sharedAgent.get("/account");
    expect(sharedHome.text).toContain(`<p>secondlyInserted</p>`);
  });

  it("shared user cannot rename homeFolder", async () => {});

  it("owner changes name and sharedUser can see the new name", async () => {});
});
