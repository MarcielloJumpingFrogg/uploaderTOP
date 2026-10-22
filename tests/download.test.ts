import logger from "../config/logger";
import { resetBuckets, resetDb, signUp, uploadFile } from "./functions";
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

await resetBuckets();
await resetDb();

it("Checking if it can download", async () => {
  const downloadUser = { username: "downloadUser" };
  const downloadAgent = request.agent(app);

  await signUp(downloadAgent, downloadUser);
  const user = await downloadAgent.get("/api/user");

  const userID = user._body.user.id;
  const uploadName = "newFolder/newFileForUniqueIdentification";
  const fileToUpload = "textTest.txt";
  await uploadFile(downloadAgent, uploadName, "/Home", fileToUpload);

  const downloadPage = await downloadAgent
    .post("/account/download")
    .type("form")
    .send({
      _method: "DOWNLOAD",
      _location: "Home/newFolder",
      _mimetype: "text/plain",
      _name: "newFileForUniqueIdentification",
      _env: "test",
    })
    .expect(200);

  const dir = path.join(__dirname, "../tests/testFiles");

  const buffer = downloadPage._body;
  const textTestFile = fs.readFileSync(dir + "/textTest.txt");
  const imageTestFile = fs.readFileSync(dir + "/spiderMan.jpg");
  expect(buffer).toEqual(textTestFile);
  expect(buffer).not.toEqual(imageTestFile);
});
