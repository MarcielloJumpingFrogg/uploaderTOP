import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import customErrorContainer from "../customErrors/customErrorContainer";
import logger from "../../config/logger";
import { tryCatch } from "@/customErrors/tryCatch";
import type { Items } from "../../generated/prisma/client";

async function getSubFiles(folder: string | undefined, currentList: Items[]) {
  if (folder == undefined) throw new Error("Folder is undefined");
  const { data: containedInFolder, error: errorGettingFilesInFolder } =
    await tryCatch(
      prisma.items.findMany({ where: { parentFolderId: folder } }),
    );
  if (errorGettingFilesInFolder)
    throw new Error("error getting the files in the folder");

  for (let i = 0; i < containedInFolder.length; i++) {
    if (containedInFolder[i]?.type === "FOLDER") {
      logger.test("we should see this 2", containedInFolder[i]);
      if (!containedInFolder[i] || !containedInFolder) throw new Error("no id");
      if (containedInFolder[i]?.id != undefined) {
        const { data: recursionResult, error: errorRecursion } = await tryCatch(
          getSubFiles(containedInFolder[i]?.id, currentList),
        );
        currentList = currentList.concat(recursionResult);
        if (errorRecursion) throw new Error("error in recursion");
      }
    }
  }
  currentList = currentList.concat(containedInFolder);

  return currentList;
}

export const addSharedFileCtrl = [
  async (req: Request, res: Response) => {
    try {
      const shareId = req.params[`shareId`];
      if (!shareId || Array.isArray(shareId)) {
        logger.error(`No share id`);
        customErrorContainer.genericError();
        res.redirect(`/`);
        return;
      }

      const shareSession = await prisma.shareSession.findUnique({
        where: {
          id: shareId,
        },
      });

      if (!shareSession) {
        logger.error("No share Session");
        customErrorContainer.databaseError(res);
        return;
      }

      if (!req.user) {
        customErrorContainer.userError(res);
        return;
      }

      const { data: originalFile, error: err } = await tryCatch(
        prisma.items.findFirst({ where: { id: shareSession.originalFile } }),
      );
      if (err || !originalFile) {
        throw new Error(
          "Could not get the original file from the current session",
        );
      }

      let filesInFolder: Items[] = [];
      if (originalFile.type === "FOLDER") {
        const { data: result, error } = await tryCatch(
          getSubFiles(originalFile.id, filesInFolder),
        );
        if (error) throw new Error("Error getting nested files in folders");
        filesInFolder = filesInFolder.concat(result);
      }
      logger.test("the one that got to the end: ", filesInFolder);
      filesInFolder.push(originalFile);
      //need to create the big folder // allegedly

      for (let i = 0; i < filesInFolder.length; i++) {
        if (
          filesInFolder == undefined ||
          filesInFolder[i] == undefined ||
          filesInFolder[i]?.id == undefined
        )
          throw new Error("no files in folder");

        const { data: createdShareFile, error: failedToCreateShareFile } =
          await tryCatch(
            prisma.sharedFiles.create({
              data: {
                destinationUser: req.user.id,
                sessionId: shareSession?.id,
                parentFolder: filesInFolder[i]?.parentFolderId || null,
                originalFile: filesInFolder[i]?.id || "",
              },
            }),
          );

        if (failedToCreateShareFile || !createdShareFile) {
          logger.error("no sharedFile", failedToCreateShareFile || null);
          customErrorContainer.genericError();
          return;
        }
        logger.test("result when creating the db entry: ", createdShareFile);
      }
    } catch (e) {
      logger.error(`Unhandled error caught: `, e);
      customErrorContainer.passportError(e, 400);
    }

    res.redirect(`/account`);
  },
];
