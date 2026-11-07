import { tryCatch } from "@/customErrors/tryCatch";
import { getOwnedFiles } from "./getOwnedFiles";
import { getSharedFiles } from "./getSharedFiles";
import { getInsideSharedFolder } from "./getInsideSharedFolder";
import logger from "../../config/logger";
import customErrorContainer from "@/customErrors/customErrorContainer";
import type { Request, Response } from "express";
import type { Items } from "../../generated/prisma/client";
import { getUserAndOriginalFolderId } from "./getUserAndOriginalFolderId";

export async function getAllFiles(req: Request, res: Response) {
  let currentFolderId: string | undefined = req.currentFolderId || "Home";
  const { data: objectData, error: errorData } = await tryCatch(
    getUserAndOriginalFolderId(req, res, currentFolderId),
  );
  if (
    errorData ||
    objectData.error ||
    !objectData.userId ||
    !objectData.originalFolderId ||
    objectData.userIsOwner == undefined
  ) {
    customErrorContainer.genericError();
    logger.error(
      "error getting user and og folder in getAllFiles: ",
      errorData || objectData.error,
    );
    res.redirect("/");
    return;
  }
  const { userId: originalUserId, userIsOwner, originalFolderId } = objectData;

  //approximate the currentFolder's id
  if (!currentFolderId) {
    throw new Error(
      `Can't have the owner of the Home folder not be the current user`,
    );
  }

  // const { data: sharedInsideFolder, error: errorSharedInsideFolder } =
  //   await tryCatch(
  //     getInsideSharedFolder(originalFolderId, userIsOwner, userId),
  //   );
  // logger.test("sharedInsideFoldera; ", sharedInsideFolder);
  // logger.toImplement(
  //   "NEED TO REMOVE THIS (the getInsideSharedFolder, since everything is shared now)",
  // );

  // if (errorSharedInsideFolder) {
  //   throw new Error(
  //     "Could not get the files inside the shared folder: ",
  //     errorSharedInsideFolder,
  //   );
  // }

  //ownedFiles:
  const { data: ownedFiles, error: ownedFilesError } = await tryCatch(
    getOwnedFiles(originalUserId, originalFolderId, userIsOwner),
  );
  if (ownedFilesError || ownedFiles === null || ownedFiles === undefined)
    throw new Error(
      `Error getting the files owned by the user: ${ownedFilesError || "Owned Files results null or undefined"}`,
    );
  //
  if (!req.user) {
    throw new Error("No user");
  }

  //sharedFiles:
  const { data: sharedFiles, error: sharedFilesError } = await tryCatch(
    getSharedFiles(req.user.id, originalFolderId),
  );
  if (sharedFilesError || sharedFiles === null) {
    logger.error(sharedFilesError);
    throw new Error("sharedFileError: ", sharedFilesError);
  }

  // logger.test("sharedFilea; ", sharedFiles);
  let finalSharedFiles: Items[] = [];
  for (let i = 0; i < sharedFiles.length; i++) {
    if (sharedFiles == undefined || sharedFiles[i] == undefined)
      throw new Error("err");
    if (sharedFiles[i] != undefined || sharedFiles != undefined) {
      finalSharedFiles.push(sharedFiles[i]);
    }
  }
  // for (let i = 0; i < sharedInsideFolder.length; i++) {
  //   if (sharedInsideFolder[i] != undefined) {
  //     finalSharedFiles.push(sharedInsideFolder[i]);
  //   }
  // }

  return { ownedFiles, finalSharedFiles };
}
