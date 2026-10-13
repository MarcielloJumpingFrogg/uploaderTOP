import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";

import { resetBuckets, resetDb } from "./functions";

beforeEach(async () => {
  await resetDb();
  await resetBuckets();
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

    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/spiderMan.jpg")
      .expect(302);

    await agent
      .post("/account/avatar")
      .attach("avatar", __dirname + "/testFiles/avatar.jpg")
      .expect(302);
    const apiResult = await agent.get("/api/user");
    // console.log("apiResult", apiResult._body.user);

    const avatarResponse = await agent.get("/avatar");

    expect(avatarResponse.headers.location).toContain(apiResult._body.user.id);
    expect(avatarResponse.headers.location).toContain(
      apiResult._body.user.avatarVersion,
    );
  });
});
