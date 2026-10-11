import { resetUploads, resetDb, resetBuckets } from "./functions";
import { beforeEach, expect, it, describe } from "vitest";
import { app } from "../app";
import request from "supertest";
import { prisma } from "../lib/prisma";

// beforeEach(async () => {
await resetUploads();
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
  // console.log("firstUser", firstUser._body);
  const firstId = firstUser._body.user.id;

  await firstAgent
    .post("/account/file")
    .type("form")
    .field("newName", "/newFolder/newFile")
    .field("_location", "Home")
    .attach("usrFile", __dirname + "/testFiles/textTest.txt")
    .expect(302);

  const shareResult = await firstAgent
    .post("/share/create")
    .send({
      _path: firstId + "/Home/newFolder/newFile",
      _edit: true,
      daysExpiration: 1,
    })
    .expect(200);

  const shareSession = await prisma.shareSession.findMany({
    where: { originalUser: firstId },
  });
  expect(shareSession.length).toBe(1);
  const idShared = shareSession[0].id;
  it("A user logs in and tries to share the file", async () => {
    // console.log("shareRESULT", shareResult.text);

    expect(shareResult.text).toContain("/share/add/" + idShared);
  });

  it("A user adds the link and has the file now", async () => {
    const secondUser = await secondAgent.get("/api/user");
    const secondId = secondUser._body.user.id;
    await secondAgent.get("/share/add/" + idShared).expect(302);

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
    console.log("sharedFileResult: ", sharedFileResult);
  });
});
