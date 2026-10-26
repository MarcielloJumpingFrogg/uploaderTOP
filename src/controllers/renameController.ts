import type { Request, Response } from "express";
import { moveFile } from "../supabaseFn/moveFile";
import { getAllFilesSubfolders } from "../supabaseFn/getAllFilesSubfolders";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { admin_supabase } from "../../config/supabase";
import customErrorContainer from "../customErrors/customErrorContainer";
import { exit } from "process";

async function updateDb(oldPath: string, newNamePath: string, newName: string) {
  const fulldb = await prisma.shareSession.findMany({});
  const allValidSessions = await prisma.shareSession.findMany({
    where: { filePath: { startsWith: oldPath } },
  });

  allValidSessions.forEach(async (session) => {
    await prisma.sharedFiles.updateMany({
      where: { sessionId: session.id },
      data: { fileName: newName },
    });
    await prisma.shareSession.updateMany({
      where: { id: session.id },
      data: { filePath: newNamePath, fileName: newName },
    });
  });
}

async function fileUpdateDb(id: string, newName: string) {
  if (id == undefined || id == "0") {
    return 0;
  }
  const result = await prisma.shareSession.update({
    where: { id: id },
    data: { fileName: newName },
  });

  const shareFileResult = await prisma.sharedFiles.updateMany({
    where: { sessionId: id },
    data: { fileName: newName },
  });
  return result;
}

function isShared(req: any) {
  const fileSessionId = req.body._sessionId;
  const folderSessionId = req.body._folderSession;
  if (fileSessionId !== "0" && fileSessionId !== undefined) {
    //this means the fileSessionId is the main provider
    logger.test("fileSessionId", fileSessionId);
    return fileSessionId;
  } else if (
    folderSessionId !== "0" &&
    folderSessionId !== undefined &&
    (fileSessionId === "0" || fileSessionId === undefined)
  ) {
    //this means the folderSession is the main provider
    logger.test("folderSessionId", folderSessionId);
    return folderSessionId;
  } else {
    return false;
  }
}

async function getIds(req: any) {
  let session;
  let owner;
  let foundSession;
  // const fileSessionId = req.body._sessionId;
  // const folderSessionId = req.body._folderSession;

  const isFileShared = isShared(req);
  if (isFileShared) {
    session = isFileShared;
  } else {
    owner = req.user.id;
    session = "0";
  }
  if (session !== "0") {
    foundSession = await prisma.shareSession.findUnique({
      where: { id: session },
    });
    owner = foundSession?.originalUser;
  }
  return { session, owner, foundSession };
}

const renameController = [
  async (req: any, res: Response) => {
    try {
      logger.test("body: ", req.body);
      const locationPath = req.body._location.replaceAll(",", "/");

      const { owner, foundSession } = await getIds(req);

      if (owner !== req.user.id && foundSession?.edit === false) {
        customErrorContainer.renameError(401, "Not allowed to edit");
        res.redirect("/account");
        return;
      }

      const partialPath = owner + "/" + locationPath + "/";
      let oldPath;
      let newPath;
      // logger.test("foundSession.fileapath: ", foundSession);
      if (
        foundSession !== undefined &&
        foundSession?.filePath !== undefined &&
        foundSession.fileName !== undefined
      ) {
        if (foundSession.type === "folder") {
          oldPath =
            foundSession.filePath +
            foundSession.fileName +
            "/" +
            req.body._name;
          newPath =
            foundSession.filePath +
            foundSession.fileName +
            "/" +
            req.body.newName;
        } else {
          oldPath = foundSession.filePath + foundSession.fileName;
          newPath = foundSession.filePath + req.body.newName;
        }
      } else {
        oldPath = partialPath + req.body._name;
        newPath = partialPath + req.body.newName;
      }
      if (req.body._type !== "folder") {
        // logger.test("oldPath: ", oldPath);
        // logger.test("newPath: ", newPath);
        await moveFile(oldPath, newPath, "Files");
        await fileUpdateDb(req.body._sessionId, req.body.newName);
      } else {
        logger.toImplement(
          "NEED TO FIX THIS BECAUSE IT'S NOT WORKING AT THE MOMENT I THINK PROBABLY",
        );
        const folderToChange = req.body._name;
        const result = await getAllFilesSubfolders(
          partialPath + folderToChange,
          "Files",
          [],
        );
        const splitResults = [];
        for (let i = 0; i < result.length; i++) {
          const splitName = result[i].split(partialPath + folderToChange + "/");
          splitResults.push(splitName[1]);
          const oldName = result[i];
          const newName =
            partialPath + req.body.newName + "/" + splitResults[i];
          const partialName = partialPath;
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
