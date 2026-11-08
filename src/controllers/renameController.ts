import type { Request, Response } from "express";
import logger from "../../config/logger";
import { moveFile } from "../supabaseFn/moveFile";
import { ProjectError } from "@/customErrors/ErrorBase";
import { getEditMode } from "@/dbMethods/getEditMode";
import { findOwnedFile } from "@/dbMethods/findOwnedFile";
import type {
  Items,
  SharedFiles,
  ShareSession,
} from "../../generated/prisma/client";
import { getOriginalFileFromSharedData } from "@/dbMethods/getOriginalFileFromSharedData";
import { findCurrentSharedFiles } from "@/dbMethods/findCurrentSharedFiles";
import { getShareSessionFromSharedFile } from "@/dbMethods/getShareSessionFromSharedFile";
import { tryCatch } from "@/customErrors/tryCatch";
import { prisma } from "@prisma";
import customErrorContainer from "@/customErrors/customErrorContainer";

async function rename(mainFile: Items, newName: string) {
  const { data, error } = await tryCatch(
    prisma.items.update({
      where: {
        id: mainFile.id,
      },
      data: {
        fileName: newName,
      },
    }),
  );

  if (error) {
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "Error while renaming file",
      cause: error,
    });
  }
  if (!data) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "No file was changed during rename",
    });
  }
}

function checkAll(
  fileId: string,
  isOwner: string,
  parentFolder: string,
  newName: string,
) {
  if (!fileId) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "File id is empty",
    });
  }
  if (!isOwner) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "isOwner is empty",
    });
  }
  if (!parentFolder) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "parentFolder is empty",
    });
  }
  if (!newName) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "newName is empty",
    });
  }
}

async function renameFunction(req: Request) {
  const body = req.body;
  const fileId: string = body._fileId;
  const isOwner: "true" | "false" = body._isOwner;
  const parentFolder: string = body._parentFolder;
  const newName: string = body.newName;

  checkAll(fileId, isOwner, parentFolder, newName);

  let mainFile: Items | null = null;

  if (!req.user)
    throw new ProjectError({
      name: "MISSING_USER",
      message: "Missing user in renameFunction",
    });

  const editMode: "Owner" | "GuestWithPermission" | "Guest" | "session" =
    await getEditMode(isOwner, req.user.id, fileId);

  let sharedFile: SharedFiles | null = null;
  let shareSession: ShareSession | null = null;
  if (editMode == "Owner") {
    mainFile = await findOwnedFile(req.user.id, parentFolder, fileId);
  } else {
    sharedFile = await findCurrentSharedFiles(fileId, req.user.id);
    shareSession = await getShareSessionFromSharedFile(sharedFile);
  }

  if (editMode == "GuestWithPermission") {
    if (!sharedFile || !shareSession) {
      throw new ProjectError({
        name: "VARIABLE_IS_EMPTY",
        message: "SharedFile or ShareSession are empty inside renameController",
      });
    }
    mainFile = await getOriginalFileFromSharedData(sharedFile, shareSession);
  }

  switch (editMode) {
    case "GuestWithPermission":
    case "Owner":
      if (!mainFile) {
        throw new ProjectError({
          name: "VARIABLE_IS_EMPTY",
          message: "MainFile is missing during owner/guestWithPermission visit",
        });
      }
      await rename(mainFile, newName);
      break;
    case "Guest":
    case "session":
      customErrorContainer.inputError(
        "You cannot modify this file, permission insufficient",
      );
      break;
    default:
      const _unhandledCase: never = editMode;
      _unhandledCase; //for some reason lsp is not ignoring it even tho i used the undescorre, this is good enough
      customErrorContainer.inputError("Catch Case, something went wrong");
      throw new ProjectError({
        name: "VARIABLE_IS_EMPTY",
        message: "NOT ALL CASES FOR EDITMODE HAVE BEEN HANDLED",
      });
  }
}

const renameController = [
  async (req: Request, res: Response) => {
    try {
      await renameFunction(req);
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

export { renameController };
