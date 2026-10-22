import {
  resetDb,
  resetBuckets,
  signUp,
  uploadFile,
  shareFile,
} from "./functions";
import { /*beforeEach,*/ expect, it, describe } from "vitest";
import { app } from "../app";
import request from "supertest";
import { prisma } from "../lib/prisma";
import { getFiles } from "../src/dbMethods/getFiles";
import logger from "../config/logger";

// beforeEach(async () => {
await resetDb();
await resetBuckets();
// });

describe("Implementing the functionality of share", async () => {
  const firstAgent = request.agent(app);
  const secondAgent = request.agent(app);
  const firstUserCredentials = {
    username: "shareFileUser1",
  };
  const secondUserCredentials = {
    username: "shareFileUser2",
  };
  await signUp(firstAgent, firstUserCredentials);
  await signUp(secondAgent, secondUserCredentials);
  const firstUser = await firstAgent.get("/api/user");
  const firstId = firstUser._body.user.id;
  const secondUser = await secondAgent.get("/api/user");
  const secondId = secondUser._body.user.id;

  const uniqueFileName = "newFileForUniqueIdentification";
  const fullUniqueFileName = `newFolder/${uniqueFileName}`;
  const fileToUpload = "textTest.txt";
  await uploadFile(firstAgent, fullUniqueFileName, "/Home", fileToUpload);

  const shareFilePath =
    firstId + "/Home/newFolder/newFileForUniqueIdentification";

  const shareParams = {
    _location: "Home/newFolder",
    _fileType: "plain/text",
    _name: "newFileForUniqueIdentification",
    canEdit: "on",
    daysExpiration: 1,
  };
  const shareResult = await shareFile(firstAgent, shareParams);

  const shareSession = await prisma.shareSession.findMany({
    where: { filePath: shareFilePath },
  });

  if (shareSession === undefined) {
    throw new Error("shareSession is undefined");
  }
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
    const secondUploadName = "newFolder/newSubFolder/newFile2";
    const _firstResult = await uploadFile(
      firstAgent,
      secondUploadName,
      "/Home",
      fileToUpload,
    );

    const paramsSecondShare = {
      _location: "Home",
      _fileType: "folder",
      _name: "newFolder",
      canEdit: "on",
      daysExpiration: 1,
    };

    const secondShareFilePath = firstId + "/Home/newFolder";
    const secondShareResult = await shareFile(firstAgent, paramsSecondShare);

    const secondShareSession = await prisma.shareSession.findFirst({
      where: { filePath: secondShareFilePath },
    });

    if (secondShareSession === null) {
      throw new Error("Second Share Session is null");
    }
    expect(secondShareResult.text).toContain(
      "/share/add/" + secondShareSession.id,
    );
    const secondShareSessionResult = await secondAgent
      .get("/share/add/" + secondShareSession.id)
      .expect(302);

    const homePageSecondAgent = await secondAgent.get("/account").expect(200);
    expect(homePageSecondAgent.text).toContain("<p>newFolder</p>");

    const multiFilesInSharedFolder = await secondAgent
      .get("/account/" + secondShareSession.id + "/Home@newFolder")
      .expect(200);

    expect(multiFilesInSharedFolder.text).toContain(`<p>${uniqueFileName}</p>`);
    expect(multiFilesInSharedFolder.text).toContain("<p>newSubFolder</p>");
  });

  it("Travel inside the original user's folder", async () => {
    const homePage = await firstAgent.get("/account").expect(200);
    expect(homePage.text).toContain("<p>newFolder</p>");
  });

  it("Travel with url: ", async () => {
    const currentResult = await firstAgent
      .get("/account/0/Home@newFolder")
      .expect(200);

    expect(currentResult.text).toContain(`<p>${uniqueFileName}</p>`);
    expect(currentResult.text).toContain(`<p>newSubFolder</p>`);
  });
});
