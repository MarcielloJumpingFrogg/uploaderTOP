import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import fs from "node:fs";
import { app } from "../app";

import { resetDb, resetUploads } from "./functions";

beforeEach(async () => {
  await resetUploads();
  await resetDb();
});

describe("Testing Multer", () => {
  const agent = request.agent(app);
  it("Image Correct", async () => {
    const cred = { username: "username", password: "Password1234!" };
    await agent
      .post("/signUp")
      .type("form")
      .send({ username: cred.username, password: cred.password });
    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/avatar.jpg")
      .expect(302);
  });

  it("Text fails", async () => {
    const cred = { username: "username", password: "Password1234!" };
    await agent
      .post("/signUp")
      .type("form")
      .send({ username: cred.username, password: cred.password });
    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/textTest.txt")
      .expect(400);
  });

  it("Image Too big", async () => {
    const cred = { username: "username", password: "Password1234!" };
    await agent
      .post("/signUp")
      .type("form")
      .send({ username: cred.username, password: cred.password });
    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/imageTooBig.png")
      .expect(400);
  });
});

describe("picture check", () => {
  it("Change Picture", async () => {
    const cred = { username: "pictureCheck", password: "Password1234!" };
    const agent = request.agent(app);
    await agent
      .post("/signUp")
      .type("form")
      .send({ username: cred.username, password: cred.password });
    const dir = __dirname + "/testUploads/";

    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/avatar.jpg")
      .expect(302);

    fs.readdir(dir, (err, files) => {
      if (err) throw err;
      expect(files.length).toBe(1);
    });

    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/spiderMan.jpg")
      .expect(302);

    fs.readdir(dir, (err, files) => {
      if (err) throw err;
      expect(files.length).toBe(1);
    });
  });
});
