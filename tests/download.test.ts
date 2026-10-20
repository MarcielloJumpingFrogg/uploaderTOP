import logger from "../config/logger";
import { resetBuckets, resetDb} from "./functions"
import { describe ,it ,  expect, beforeEach } from "vitest";
import request from "supertest"
import {app} from "../app"

logger.test("need to implement the downaload strategy (ouch)")

beforeEach(async () => {
  resetBuckets()
  resetDb()

})

describe("Simple download: ", async () => {
  const downloadUser = { username: "downloadUser", password: "Password1234!"}
  const downloadAgent = request.agent(app)

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

  const downloadPage = await downloadAgent.post("/account/download").type("form").send({
    _method: "DOWNLOAD",
    _location: "Home/newFolder",
    _name: "newFileForUniqueIdentification",
    _env: "test"
  }).expect(200)

  expect(downloadPage).toContain("http")
})
