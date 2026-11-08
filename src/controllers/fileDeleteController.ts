// import { admin_supabase } from "../../config/supabase";
import { deleteFile } from "../supabaseFn/deleteFile";
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

async function getRecursivePath(folderId: string, currentList: Items[]) {
  const { data: allSubFilesData, error: allSubFilesError } = await tryCatch(
    prisma.items.findMany({
      where: {
        parentFolderId: folderId,
      },
    }),
  );

  logger.test("result: ", allSubFilesData);
  if (allSubFilesError) throw new Error("Sub Files Error: ", allSubFilesError);

  for (let i = 0; i < allSubFilesData?.length; i++) {
    const file = allSubFilesData[i];
    if (file?.type == "FOLDER") {
      const { data: recursiveResult, error: recursiveError } = await tryCatch(
        getRecursivePath(file.id, currentList),
      );
      if (recursiveError) throw new Error("recursiveError: ", recursiveError);
      currentList = currentList.concat(recursiveResult);
    }
  }

  currentList = currentList.concat(allSubFilesData);

  return currentList;
}

async function deleteFromDb(userId: string, folder: Items) {
  if (!folder || !folder.id) return;
  const { data, error } = await tryCatch(
    prisma.items.delete({ where: { id: folder.id, ownerId: userId } }),
  );

  if (error) {
    logger.error("error deleting form db: ", error);
    throw new Error("error deleting from db: ", error);
  }

  logger.test("data: ", data);
}

async function getOwnedFile(
  userId: string,
  bodyParentFolder: string | null | undefined,
  fileId: string,
) {
  const { data: ownedFile, error: ownedError } = await tryCatch(
    prisma.items.findUnique({
      where: {
        ownerId: userId,
        id: fileId,
        parentFolderId: getParentFolder(bodyParentFolder),
      },
    }),
  );

  if (ownedError) throw new Error("error: ", ownedError);

  return ownedFile;
}

function getParentFolder(bodyParentFolder: string | null | undefined) {
  if (bodyParentFolder == "Home" || bodyParentFolder == undefined) {
    logger.test("current parent folder: null");
    return null;
  } else {
    logger.test("current parent folder: ", bodyParentFolder);
    return bodyParentFolder;
  }
}

async function getSharedFile(fileId: string, userId: string) {
  const { data: sharedFile, error: sharedError } = await tryCatch(
    prisma.sharedFiles.findUnique({
      where: {
        id: fileId,
        destinationUser: userId,
      },
    }),
  );
  if (sharedError) throw new Error("No file in sharedUserPermission");

  if (!sharedFile) {
    throw new Error("could not get sessionId from sharedFile");
  }

  return sharedFile;
}

async function getShareSession(sharedFile: SharedFiles) {
  const { data: sessionData, error: sessionError } = await tryCatch(
    prisma.shareSession.findUnique({
      where: {
        id: sharedFile.sessionId,
      },
    }),
  );

  if (sessionError || !sessionData) {
    throw new Error("could not get the shareSession");
  }

  return sessionData;
}

async function sharedUserPermission(sharedSession: ShareSession) {
  let canEdit: boolean = false;

  if (sharedSession.edit == true) {
    canEdit = true;
  } else {
    canEdit = false;
  }

  return canEdit;
}

async function shareSessionTarget(
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
}

export const fileDeleteController = [
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        customErrorContainer.userError(res);
        return;
      }
      const fileId: string = req.body._fileId;
      const isOwner: "true" | "false" = req.body._isOwner;
      const bodyParentFolder: string | null | undefined =
        req.body._parentFolder;

      if (!fileId) {
        customErrorContainer.genericError();
        res.redirect("/");
        return;
      }

      let originalFile: Items | null = null;
      let error: Error | null = null;
      let sharedFile: SharedFiles | null = null;
      let shareSession: ShareSession | null = null;
      let deleteMode:
        "Owner" | "GuestWithPermission" | "Guest" | "DeletingSession" | null =
        null;
      let canEdit: boolean = false;

      if (isOwner == "true") {
        const { data: ownedResult, error: ownedError } = await tryCatch(
          getOwnedFile(req.user.id, bodyParentFolder, fileId),
        );

        error = ownedError;
        originalFile = ownedResult;
        deleteMode = "Owner";
        canEdit = true;
      } else {
        if (!fileId) throw new Error("No file Id");

        const { data: sharedFileResult, error: errorFile } = await tryCatch(
          getSharedFile(fileId, req.user.id),
        );

        if (errorFile) {
          logger.error("Error getting the sharedFile: ", errorFile);
          throw new Error("Error getting the sharedFile: ", errorFile);
        }
        sharedFile = sharedFileResult;

        //get info if it is the main file shared  by the original user or just a subfile of a bigger folder {{{
        let isMainFile: boolean = false;

        const { data: shareSessionResult, error: errorShareSession } =
          await tryCatch(getShareSession(sharedFile));

        if (errorShareSession) {
          throw new Error("Error getting shareSession: ", errorShareSession);
        }
        if (!shareSessionResult) {
          throw new Error("could not get sharesession");
        }
        shareSession = shareSessionResult;

        const { data: isShareSessionTarget, error: errorSessionTarget } =
          await tryCatch(shareSessionTarget(shareSession, sharedFile));
        if (errorSessionTarget) {
          throw new Error("Error getting session: ", errorSessionTarget);
        }

        isMainFile = isShareSessionTarget;
        //}}}

        if (!isMainFile) {
          const { data: canEditResult, error: canEditError } = await tryCatch(
            sharedUserPermission(shareSession),
          );
          if (canEditError) throw new Error("Error Getting canEdit");
          canEdit = canEditResult; //if not the main file i can edit it fine
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
      if (error) {
        customErrorContainer.genericError();
        res.redirect("/");
        return;
      }

      if (deleteMode == "GuestWithPermission") {
        const { data: ogFile, error: ogError } = await tryCatch(
          prisma.items.findUnique({
            where: {
              id: sharedFile?.originalFile,
              ownerId: shareSession?.originalUser,
            },
          }),
        );
        if (ogError || !ogFile)
          throw new Error(`in delete mode: ogError: ${ogError || "No ogFile"}`);
        originalFile = ogFile;
        logger.test("og filea; ", ogFile);
      }
      switch (deleteMode) {
        case "GuestWithPermission":
        case "Owner":
          if (!originalFile) throw new Error("No original file");
          const { data: recursivePath, error: recursivePathError } =
            await tryCatch(getRecursivePath(originalFile.id, []));
          if (recursivePathError)
            throw new Error("recursivePath Error: ", recursivePathError);
          if (!originalFile) throw new Error("No file");

          recursivePath.push(originalFile);
          for (let i = 0; i < recursivePath.length; i++) {
            const path = recursivePath[i];
            if (!path) throw new Error("path is undefined");
            const recursiveDeleteResult = await tryCatch(
              recursiveDelete(
                `${originalFile.ownerId}/Storage/${path.id}`,
                "Files",
              ),
            );
            if (recursiveDeleteResult.error) {
              logger.error(
                "recursiveDeleteResult Error: ",
                recursiveDeleteResult.error,
              );
              throw new Error("recursiveDeleteResult Error: ");
            }
          }
          deleteFromDb(originalFile.ownerId, originalFile);
          break;
        case "DeletingSession":
          logger.toImplement("deteling session");
          break;
        case "Guest":
          logger.toImplement("cannotdelete");
          break;
        default:
          logger.toImplement("catch cases");
      }
      // if (req.body._type == "folder" || req.body._type == "alt_folder") {
      //   await recursiveDelete(fullPath, "Files");
      // }
      // await deleteFile(fullPath, "Files");
      // const result = await prisma.sharedFiles.deleteMany({
      //   where: { sessionId: req.body._sessionId, destinationUser: req.user.id },
      // });
      res.redirect("/account");
    } catch (e) {
      logger.error("Error while deleting file: ", e);
      customErrorContainer.genericError();
      res.redirect("/");
    }
  },
];
