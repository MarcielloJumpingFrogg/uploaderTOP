// import { admin_supabase } from "../../config/supabase";
import { recursiveDelete } from "../supabaseFn/recursiveDelete";
import type { Request, Response } from "express";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import customErrorContainer from "@/customErrors/customErrorContainer";
import { tryCatch } from "@/customErrors/tryCatch";
import type {
  Items,
  SharedFiles,
  ShareSession,
} from "../../generated/prisma/client";
import { ProjectError } from "@/customErrors/ErrorBase";
import { getRecursivePath } from "@/dbMethods/getRecursivePath";
import { findOwnedFile } from "@/dbMethods/findOwnedFile";
import { findCurrentSharedFiles } from "@/dbMethods/findCurrentSharedFiles";
import { getShareSessionFromSharedFile } from "@/dbMethods/getShareSessionFromSharedFile";
import { getOriginalFileFromSharedData } from "@/dbMethods/getOriginalFileFromSharedData";

async function deleteFromDb(userId: string, folder: Items) {
  //{{{
  if (!folder || !folder.id) return;
  const { data, error } = await tryCatch(
    prisma.items.delete({ where: { id: folder.id, ownerId: userId } }),
  );

  if (error) {
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "Error deleting inside the deleteFromDb",
      cause: error,
    });
  }

  logger.test("data: ", data);
  //}}}
}

function sharedUserPermission(sharedSession: ShareSession) {
  //{{{
  let canEdit: boolean = false;

  if (sharedSession.edit == true) {
    canEdit = true;
  } else {
    canEdit = false;
  }

  return canEdit;
  //}}}
}

function shareSessionTarget(
  //{{{
  shareSession: ShareSession,
  sharedFile: SharedFiles,
) {
  let isMainFile: boolean = false;
  if (shareSession.originalFile == sharedFile.originalFile) {
    isMainFile = true;
  } else {
    isMainFile = false;
  }

  return isMainFile;
  //}}}
}

async function deleteAllFilesWithShareSession(shareSession: ShareSession) {
  const { data, error } = await tryCatch(
    prisma.sharedFiles.deleteMany({
      where: {
        sessionId: shareSession.id,
      },
    }),
  );
  if (error) {
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "There was an error during deleteAllFilesWithShareSession",
      cause: error,
    });
  }

  if (!data) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "No files were deleted",
    });
  }
}

async function fileDelete(req: Request, res: Response) {
  if (!req.user) {
    customErrorContainer.userError(res);
    throw new ProjectError({
      name: "MISSING_USER",
      message: "The user is missing",
    });
  }
  const fileId: string = req.body._fileId;

  const isOwner: "true" | "false" = req.body._isOwner;
  const bodyParentFolder: string | null | undefined = req.body._parentFolder;

  if (!fileId) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "File id is empty inside fileDelete",
    });
  }

  let originalFile: Items | null = null;
  let sharedFile: SharedFiles | null = null;
  let shareSession: ShareSession | null = null;
  let deleteMode:
    "Owner" | "GuestWithPermission" | "Guest" | "DeletingSession" | null = null;
  let canEdit: boolean = false;

  if (isOwner == "true") {
    const ownedResult = await findOwnedFile(
      req.user.id,
      bodyParentFolder,
      fileId,
    );
    originalFile = ownedResult;
    deleteMode = "Owner";
    canEdit = true;
  } else {
    sharedFile = await findCurrentSharedFiles(fileId, req.user.id);
    let isMainFile: boolean = false;
    shareSession = await getShareSessionFromSharedFile(sharedFile);
    isMainFile = shareSessionTarget(shareSession, sharedFile);

    if (isMainFile == false) {
      canEdit = sharedUserPermission(shareSession);
      if (canEdit) {
        deleteMode = "GuestWithPermission";
      } else {
        deleteMode = "Guest";
      }
    } else {
      canEdit = false;
      deleteMode = "DeletingSession";
    }
  }

  if (deleteMode === "GuestWithPermission") {
    if (!sharedFile || !shareSession)
      throw new ProjectError({
        name: "VARIABLE_IS_EMPTY",
        message:
          "sharedFile is empty before calling to get original file, this is never supposed to happen but typescript doesn't know",
      });
    const ogFile = await getOriginalFileFromSharedData(
      sharedFile,
      shareSession,
    );
    originalFile = ogFile;
    logger.test("og filea; ", ogFile);
  }
  switch (deleteMode) {
    case "GuestWithPermission":
    case "Owner":
      if (!originalFile)
        throw new ProjectError({
          name: "VARIABLE_IS_EMPTY",
          message: "OriginalFile is empty in mode owner/guestWithPermission",
        });

      const recursivePath = await getRecursivePath(originalFile.id, []);

      recursivePath.push(originalFile);
      for (let i = 0; i < recursivePath.length; i++) {
        const path = recursivePath[i];
        if (!path)
          throw new ProjectError({
            name: "VARIABLE_IS_EMPTY",
            message: "Path is empty inside owner/guestWithPermission mode",
          });
        await recursiveDelete(
          `${originalFile.ownerId}/Storage/${path.id}`,
          "Files",
        );
      }
      await deleteFromDb(originalFile.ownerId, originalFile);
      break;
    case "DeletingSession":
      if (!shareSession)
        throw new ProjectError({
          name: "VARIABLE_IS_EMPTY",
          message: "ShareSession is empty when trying to delete the session",
        });
      await deleteAllFilesWithShareSession(shareSession);

      break;
    case "Guest":
      customErrorContainer.inputError(
        "You cannot delete a file that is not yours",
      );
      break;
    default:
      const _unhandledCases: never = deleteMode;
      _unhandledCases; //for some reason lsp is not ignoring it even tho i used the undescorre, this is good enough
      customErrorContainer.inputError(
        "Catch case, there appears to be a non handled error",
      );
      logger.error("Catch case, there appears to be a non handled error");
      throw new ProjectError({
        name: "VARIABLE_IS_EMPTY",
        message: "THIS MESSAGE IS NOT SUPPOSED TO BE SEEN, IT'S A CATCHALL",
      });
  }
}

export const fileDeleteController = [
  async (req: Request, res: Response) => {
    try {
      await fileDelete(req, res);
    } catch (error: unknown) {
      if (error instanceof ProjectError) {
        if (error.name == "MISSING_USER") {
          customErrorContainer.userError(res);
          return;
        }
        if (error.name == "VARIABLE_IS_EMPTY") {
          logger.error("VARIABLE_IS_EMPTY", error);
          customErrorContainer.genericError();
          res.redirect("/");
          return;
        }
        if (error.name == "SERVER_ERROR") {
          logger.error("SERVER_ERROR COULD NOT COMPLETE: ", error);
          customErrorContainer.genericError();
          res.redirect("/");
          return;
        }
        const _unHandledCases: never = error.name;
        _unHandledCases; //for some reason lsp is not ignoring it even tho i used the undescorre, this is good enough
      }
      logger.error("UNEXPECTED ERROR: ", error);
    }
    res.redirect("/");
  },
];
