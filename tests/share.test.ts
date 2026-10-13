import { resetDb, resetBuckets } from "./functions";
import { beforeEach, expect, it, describe } from "vitest";
import { app } from "../app";
import request from "supertest";
import { prisma } from "../lib/prisma";
import { getFiles } from "../src/dbMethods/getFiles";
import { admin_supabase } from "../config/supabase";

// beforeEach(async () => {
await resetDb();
await resetBuckets();
// });

describe("Implementing the functionality of share", async () => {
  const firstAgent = request.agent(app);
  const secondAgent = request.agent(app);
  const firstUserCredentials = {
    username: "shareFileUser1",
    password: "Password1234!",
  };
  const secondUserCredentials = {
    username: "shareFileUser2",
    password: "Password1234!",
  };
  await firstAgent.post("/signUp").type("form").send({
    username: firstUserCredentials.username,
    password: firstUserCredentials.password,
  });
  await secondAgent.post("/signUp").type("form").send({
    username: secondUserCredentials.username,
    password: secondUserCredentials.password,
  });

  const firstUser = await firstAgent.get("/api/user");
  const firstId = firstUser._body.user.id;
  const secondUser = await secondAgent.get("/api/user");
  const secondId = secondUser._body.user.id;

  await firstAgent
    .post("/account/file")
    .type("form")
    .field("newName", "/newFolder/newFile")
    .field("_location", "Home")
    .attach("usrFile", __dirname + "/testFiles/textTest.txt")
    .expect(302);

  const shareFilePath = firstId + "/Home/newFolder/newFile";
  const shareResult = await firstAgent
    .post("/share/create")
    .send({
      _path: shareFilePath,
      _fileType: "plain/text",
      canEdit: "on",
      daysExpiration: 1,
    })
    .expect(200);

  const shareSession = await prisma.shareSession.findMany({
    where: { filePath: shareFilePath },
  });

  expect(shareSession.length).toBe(1);
  const idShared = shareSession[0].id;

  it("A user logs in and tries to share the file", async () => {
    expect(shareResult.text).toContain("/share/add/" + idShared);
  });

  it("A user adds the link and has the file now", async () => {
    await secondAgent.get("/share/add/" + idShared).expect(302);
    const getFilesResult = await getFiles(secondId, "Home");

    const sharedFileResult = await prisma.sharedFiles.findMany({
      where: {
        sessionId: idShared,
      },
    });

    expect(sharedFileResult.length).toBe(1);
    expect(sharedFileResult[0]?.originalUser).toBe(firstId);
    expect(sharedFileResult[0]?.destinationUser).toBe(secondId);
    expect(sharedFileResult[0]?.expiration).toStrictEqual(
      shareSession[0]?.expiration,
    );

    const sourceFileFirstShare = await getFiles(firstId, "/Home/newFolder");
    for (let i = 0; i < sourceFileFirstShare.length; i++) {
      expect(sourceFileFirstShare[i]).toBeOneOf(getFilesResult);
    }
  });

  it("There are multiple files in a single shared folder: ", async () => {
    const firstResult = await firstAgent
      .post("/account/file")
      .type("form")
      .field("newName", "/newFolder/newSubFolder/newFile2")
      .field("_location", "Home")
      .attach("usrFile", __dirname + "/testFiles/textTest.txt")
      .expect(302);

    const secondShareFilePath = firstId + "/Home/newFolder";
    const secondShareResult = await firstAgent
      .post("/share/create")
      .send({
        _path: secondShareFilePath,
        _fileType: "folder",
        canEdit: "on",
        daysExpiration: 1,
      })
      .expect(200);

    const secondShareSession = await prisma.shareSession.findFirst({
      where: { filePath: secondShareFilePath },
    });

    expect(secondShareResult.text).toContain(
      "/share/add/" + secondShareSession.id,
    );

    await secondAgent.get("/share/add/" + secondShareSession.id).expect(302);

    const sourceFileSecondShare = await getFiles(firstId, "Home");

    const secondGetFiles = await getFiles(secondId, "Home");
    for (let i = 0; i < sourceFileSecondShare.length; i++) {
      expect(sourceFileSecondShare[i]).toBeOneOf(secondGetFiles);
    }
  });
});
