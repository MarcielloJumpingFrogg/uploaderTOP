import type { Request, Response } from "express";
import { moveFile } from "../supabaseFn/moveFile";
import { getAllFilesSubfolders } from "../supabaseFn/getAllFilesSubfolders";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

async function updateDb(oldPath: string, newNamePath: string, newName: string) {
  const fulldb = await prisma.shareSession.findMany({});
  logger.test("fulldb", fulldb);
  logger.test("this name is calling the function: ", newName);
  logger.test("inside UpdateDb oldName: : ", oldPath);
  const allValidSessions = await prisma.shareSession.findMany({
    where: { filePath: { startsWith: oldPath } },
  });
  logger.test("otherTest: ", allValidSessions);

  allValidSessions.forEach(async (session) => {
    await prisma.sharedFiles.updateMany({
      where: { sessionId: session.id },
      data: { fileName: newName },
    });
    await prisma.shareSession.update({
      where: { id: session.id },
      data: { filePath: newNamePath, fileName: newName },
    });
  });
}

const renameController = [
  async (req: any, res: Response) => {
    try {
      logger.test("body: ", req.body);
      const locationPath = req.body._location.replaceAll(",", "/");

      let owner;
      let session;
      if (
        req.body._folderSession === "0" ||
        req.body._folderSession === undefined
      ) {
        if (req.body._sessionId === "0" || req.body._sessionId === undefined) {
          session = "0";
          owner = req.user.id;
        } else {
          session = req.body._sessionId;
        }
      } else {
        session = req.body._folderSession;
      }
      if (session !== "0") {
        const _tempSession = await prisma.shareSession.findUnique({
          where: { id: session },
        });
        owner = _tempSession?.originalUser;
      }

      const partialPath = owner + "/" + locationPath + "/";
      const oldFile = partialPath + req.body._name;
      const newFile = partialPath + req.body.newName;
      if (req.body._type !== "folder") {
        await moveFile(oldFile, newFile, "Files");
        await updateDb(oldFile, newFile, req.body.newName);
      } else {
        const folderToChange = req.body._name;
        const result = await getAllFilesSubfolders(
          partialPath + folderToChange,
          "Files",
          [],
        );
        const splitResults = [];
        for (let i = 0; i < result.length; i++) {
          logger.test("partialPath", partialPath);
          logger.test("folderToChange", folderToChange);

          const splitName = result[i].split(partialPath + folderToChange + "/");
          splitResults.push(splitName[1]);
          const oldName = result[i];
          const newName =
            partialPath + req.body.newName + "/" + splitResults[i];
          const partialName = partialPath;
          logger.test("partialName: ", partialName);
          await moveFile(oldName, newName, "Files");
          await updateDb(partialName, newName, req.body.newName);
        }
      }

      const fullPath =
        "/" +
        (req.body._folderSession || "0") +
        "/" +
        req.body._location.replaceAll("/", "@");

      res.redirect("/account" + fullPath);
    } catch (e) {
      logger.error("Error: ", e);
    }
  },
];

export { renameController };
