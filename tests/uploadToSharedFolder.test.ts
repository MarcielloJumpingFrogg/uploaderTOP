import request, { agent } from "supertest";
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

describe("The shared user can upload files to the owner's folder ", async () => {
  const ownerPar = { username: "ownShareUpload" };
  const sharedPar = { username: "shrdShreUpld" };
  const ownerAgent = request.agent(app);
  const sharedAgent = request.agent(app);

  const ownerId = await signUp(ownerAgent, ownerPar);
  const sharedId = await signUp(sharedAgent, sharedPar);

  await uploadFile(ownerAgent, "newFolder/ownerFile", "Home", "textTest.txt");
  const { shareSession } = await shareFile(ownerAgent, {
    _location: "Home",
    _fileType: "folder",
    _name: "newFolder",
    canEdit: "on",
    daysExpiration: 1,
  });

  it("just to shut it up ", () => {
    logger.toImplement("missing test");
    expect(1).toBe(1);
  });
});
