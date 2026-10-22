import type { Request, Response } from "express";
import { moveFile } from "../supabaseFn/moveFile";
import { getAllFilesSubfolders } from "../supabaseFn/getAllFilesSubfolders";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

const renameController = [
  async (req: Request, res: Response) => {
    logger.test("body: ", req.body);
    const locationPath = req.body._location.replaceAll(",", "/");
    logger.toImplement("need to fix this because i got hungry and confused");
    let owner;
    const sessionId = req.body._sessionId;
    const folderSession = req.body._folderSession;
    logger.test("folderSession: ", folderSession);
    if (sessionId == 0 || sessionId == undefined) {
      if (folderSession == 0 || folderSession == undefined) {
        // logger.test("this user");
        owner = req.user.id;
      } else {
        const shareSession = await prisma.shareSession.findUnique({
          where: { id: folderSession },
        });
        // logger.test("the other one", shareSession);
        owner = shareSession?.originalUser;
      }
    } else {
      const shareSession = await prisma.shareSession.findUnique({
        where: { id: sessionId },
      });
      // logger.test("the other one", shareSession);
      owner = shareSession?.originalUser;
    }
    logger.test("owner", owner);
    // if (req.body._folderOwner === "0" || !req.body._folderOwner) {
    //   owner = req.user.id;
    // } else {
    //   owner = req.body._folderOwner;
    // }
    const partialPath = owner + "/" + locationPath + "/";
    const oldFile = partialPath + req.body._name;
    const newFile = partialPath + req.body.newName;
    if (req.body._type !== "folder") {
      await moveFile(oldFile, newFile, "Files");
    } else {
      const folderToChange = req.body._name;
      const result = await getAllFilesSubfolders(
        partialPath + folderToChange,
        "Files",
        [],
      );
      const splitResults = [];
      for (let i = 0; i < result.length; i++) {
        splitResults.push(
          result[i].split(partialPath + folderToChange + "/")[1],
        );
        const oldName = result[i];
        const newName = partialPath + req.body.newName + "/" + splitResults[i];
        await moveFile(oldName, newName, "Files");
      }
    }

    const fullPath =
      "/" +
      (folderSession || "0") +
      "/" +
      req.body._location.replaceAll("/", "@");

    res.redirect("/account" + fullPath);
  },
];

export { renameController };
