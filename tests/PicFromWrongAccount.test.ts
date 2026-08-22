import { it, expect, beforeEach, test } from "vitest";
import request from "supertest";
import { app } from "../app";
import fs from "fs";
import { resetDb, resetUploads } from "./functions";

beforeEach(async () => {
  await resetUploads();
  await resetDb();
});

test("Get Picture From Wrong Account", async () => {
  const cred1 = { username: "firstAccount", password: "Password1234!" };
  const cred2 = { username: "secondAccount", password: "Password1234!" };
  const agent1 = request.agent(app);
  const agent2 = request.agent(app);

  await agent1
    .post("/signUp")
    .type("form")
    .send({ username: cred1.username, password: cred1.password });
  await agent2
    .post("/signUp")
    .type("form")
    .send({ username: cred2.username, password: cred2.password });
  const dir = __dirname + "/testUploads/users/";

  const response1 = await agent1.get("/api/login");
  const user1Id = response1.body.user.id;
  const response2 = await agent2.get("/api/login");
  const user2Id = response2.body.user.id;

  await agent1
    .post("/account/avatar")
    .attach("avatar", __dirname + "/testFiles/avatar.jpg")
    .expect(302);

  let firstFileName;
  const dir1 = dir + user1Id;
  const dir2 = dir + user2Id;

  fs.readdir(dir1, (err: any, files) => {
    expect(files.length).toBe(1);
    if (err) {
      throw new Error(err);
    }
  });

  await agent2
    .post("/account/avatar")
    .attach("avatar", __dirname + "/testFiles/spiderMan.jpg")
    .expect(302);

  fs.readdir(dir2, (err: any, files) => {
    expect(files.length).toBe(1);
    if (err) {
      throw new Error(err);
    }
  });

  await agent2.get("/img/" + firstFileName).expect(400);
});
