import { resetUploads, resetDb, resetBuckets } from "./functions";
import { beforeEach, expect, it, describe } from "vitest";
import { app } from "../app";
import request from "supertest";

beforeEach(async () => {
  await resetUploads();
  await resetDb();
  await resetBuckets();
});

describe("Implementing the functionality of share", () => {
  it("A user logs in and tries to share the file", async () => {
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
    console.log("firstUser", firstUser._body);

    await firstAgent
      .post("/account/file")
      .type("form")
      .field("newName", "/newFolder/newFile")
      .attach("file", __dirname + "/testFiles/textTest.txt")
      .expect(200);

    const shareResult = await firstAgent
      .post("/share/create")
      .send({ _path: firstUser._body.user.id + "/Home/newFolder/newFile" })
      .expect(302);

    expect(shareResult);
  });
});
