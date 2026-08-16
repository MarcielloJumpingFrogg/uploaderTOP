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
  const dir = __dirname + "/testUploads/";

  await agent1
    .post("/account/avatar")
    .attach("avatar", __dirname + "/testFiles/avatar.jpg")
    .expect(302);

  let firstFileName;

  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    expect(files.length).toBe(1);
    firstFileName = files[0];
    console.log("firstest", firstFileName);
  });

  let secondFileName;

  await agent2
    .post("/account/avatar")
    .attach("avatar", __dirname + "/testFiles/spiderMan.jpg")
    .expect(302);

  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    expect(files.length).toBe(2);
    secondFileName = files[1];
    console.log("secondest:", secondFileName);
  });

  await agent2.get("/img/" + firstFileName).expect(400);
});
