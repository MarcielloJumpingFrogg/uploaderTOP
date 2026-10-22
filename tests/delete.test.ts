import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../app";
import logger from "../config/logger";
import {
  resetBuckets,
  resetDb,
  signUp,
  uploadFile,
  shareFile,
} from "./functions";
import { prisma } from "../lib/prisma";

await resetDb();
await resetBuckets();

async function deleteFile(
  agent: any,
  data: {
    _location: string;
    _name: string;
    _type: string;
    _sessionId?: string;
  },
) {
  return await agent.post("/account/delete").send(data).expect(302);
}

describe("create the users and test delete file operations: ", async () => {
  const ownerParams = { username: "ownerDelete" };
  const ownerAgent = request.agent(app);
  const sharedParams = { username: "sharedDelete" };
  const sharedAgent = request.agent(app);

  await signUp(ownerAgent, ownerParams);
  await signUp(sharedAgent, sharedParams);

  const _apiOwner = await ownerAgent.get("/api/user");
  const ownerId = _apiOwner._body.user.id;
  const _apiShared = await sharedAgent.get("/api/user");
  const sharedId = _apiShared._body.user.id;

  const uniqueName = "uniqueFileNameToBeDeleted.txt";
  const fileUploadName = `newFolder/${uniqueName}`;
  const fileToUpload = "textTest.txt";

  it("The owner of the file can delete it's own file", async () => {
    const uploadResult = await uploadFile(
      ownerAgent,
      fileUploadName,
      "Home",
      fileToUpload,
    );
    expect(uploadResult.statusCode).toBe(302);

    const preDeleteFolder = await ownerAgent.get("/account/0/Home@newFolder");
    expect(preDeleteFolder.text).toContain(`<p>${uniqueName}</p>`);

    await deleteFile(ownerAgent, {
      _location: "Home/newFolder",
      _name: uniqueName,
      _type: "txt",
    });

    const postDeleteFolder = await ownerAgent.get("/account/0/Home@newFolder");
    expect(postDeleteFolder.text).toContain(`<p>No files</p>`);
    const preDeleteHome = await ownerAgent.get("/account");
    expect(preDeleteHome.text).toContain("<p>newFolder</p>");
    await deleteFile(ownerAgent, {
      _location: "Home",
      _name: "newFolder",
      _type: "folder",
    });

    const postDeleteHome = await ownerAgent.get("/account");
    expect(postDeleteHome.text).toContain("<p>No files</p>");
  });

  it("Shared file get's removed upon deletion, but the sharer maintains it", async () => {
    const uploadResult = await uploadFile(
      ownerAgent,
      fileUploadName,
      "Home",
      fileToUpload,
    );
    expect(uploadResult.statusCode).toBe(302);

    await shareFile(ownerAgent, {
      _location: "Home",
      _fileType: "txt",
      _name: uniqueName,
      canEdit: "on",
      daysExpiration: 1,
    });

    const shareSession = await prisma.shareSession.findFirst({
      where: { originalUser: ownerId, fileName: uniqueName },
    });
    if (!shareSession) {
      throw new Error("No Share Session");
    }

    const preShareSharedHome = await sharedAgent.get("/account");
    expect(preShareSharedHome.text).toContain("<p>No files</p>");

    await sharedAgent.get("/share/add/" + shareSession.id);

    const postShareSharedHome = await sharedAgent.get("/account");
    expect(postShareSharedHome.text).toContain(`<p>${uniqueName}</p>`);

    await deleteFile(sharedAgent, {
      _location: "Home",
      _name: uniqueName,
      _type: "txt",
      _sessionId: shareSession.id,
    });
    const postDeleteSharedHome = await sharedAgent.get("/account");
    expect(postDeleteSharedHome.text).toContain(`<p>No files</p>`);

    const postDeleteOwner = await ownerAgent.get("/account");
    expect(postDeleteOwner.text).toContain("<p>newFolder</p>");
    const postDeleteOwnerFolder = await ownerAgent.get(
      "/account/0/Home@newFolder",
    );
    expect(postDeleteOwnerFolder.text).toContain(`<p>${uniqueName}</p>`);
  });
});
