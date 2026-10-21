import logger from "../config/logger";
import { resetBuckets, resetDb } from "./functions";
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { prisma } from "../lib/prisma";
import fs from "fs";
import path from "path";

beforeEach(async () => {
  await resetBuckets();
  await resetDb();
});

describe("Simple download: ", async () => {
  it("something", async () => {
    const downloadUser = {
      username: "downloadUser",
      password: "Password1234!",
    };
    const downloadAgent = request.agent(app);

    await downloadAgent.post("/signUp").type("form").send({
      username: downloadUser.username,
      password: downloadUser.password,
    });
    const user = await downloadAgent.get("/api/user");

    const userID = user._body.user.id;

    await downloadAgent
      .post("/account/file")
      .type("form")
      .field("newName", "newFolder/newFileForUniqueIdentification")
      .field("_location", "/Home")
      .attach("usrFile", __dirname + "/testFiles/textTest.txt")
      .expect(302);

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
});
