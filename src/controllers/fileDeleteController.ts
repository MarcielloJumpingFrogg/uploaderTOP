// import { admin_supabase } from "../../config/supabase";
import { deleteFile } from "../supabaseFn/deleteFile";
import { recursiveDelete } from "../supabaseFn/recursiveDelete";
import type { Request, Response } from "express";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import customErrorContainer from "@/customErrors/customErrorContainer";
import { tryCatch } from "@/customErrors/tryCatch";
import type { Items, SharedFiles } from "../../generated/prisma/client";
import { getFromCurrentFolderId } from "@/dbMethods/getFromCurrentFolderId";

async function getFile(
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

async function getSession(sharedFile: SharedFiles) {
  const { data: getSessionData, error: getSessionError } = await tryCatch(
    prisma.shareSession.findFirst({
      where: {
        id: sharedFile.sessionId,
      },
    }),
  );

  if (getSessionError)
    throw new Error("error getting session: ", getSessionError);

  // const {data: getOgFile, error: ogFileError } = await tryCatch(prisma.items.findUnique({where: {
  //   id: sharedFile.originalFile
  // }}))
  //
  // if(ogFileError) throw new Error("error getting ogFile: ", ogFileError)

  if (getSessionData?.originalFile == sharedFile.originalFile) {
    logger.test("Correctly");
  }
}

export const fileDeleteController = [
  async (req: Request, res: Response) => {
    if (!req.user) {
      customErrorContainer.userError(res);
      return;
    }
    const fileId: string = req.body._fileId;
    const isOwner: boolean = req.body._isOwner;
    const bodyParentFolder: string | null | undefined = req.body._parentFolder;

    if (!fileId) {
      customErrorContainer.genericError();
      res.redirect("/");
      return;
    }

    let file: Items | null;
    let error: Error | null = null;
    logger.toImplement(
      "need to find out if the whole folder is the file we are trying to delete or just the shared file , it's a mess",
    );
    if (isOwner == true) {
      const { data: ownedResult, error: ownedError } = await tryCatch(
        getFile(req.user.id, bodyParentFolder, fileId),
      );
      error = ownedError;
      file = ownedResult;
    } else {
      const { data: parent, error: errorParent } = await tryCatch(
        prisma.sharedFiles.findUnique({
          where: {
            destinationUser: req.user.id,
            id: req.body.bodyParentFolder,
          },
        }),
      );

      const { data: ogFile, error: ogFileError } = await tryCatch(
        prisma.sharedFiles.findUnique({
          where: {
            destinationUser: req.user.id,
            id: fileId,
            parentFolder: parent?.originalFile,
          },
        }),
      );

      if (!ogFile) {
        logger.error("error: no og file");
        res.redirect("/");
        return;
      }

      logger.test("ogFile: ", ogFile);
      try {
        await getSession(ogFile);
      } catch (e) {
        logger.error("e:", e);
        res.redirect("/");
      }
      if (ogFileError) {
        logger.error("ogFileError in deteleFile: ", ogFileError);
        res.redirect("/");
        return;
      }
    }
    if (error) {
      customErrorContainer.genericError();
      res.redirect("/");
      return;
    }

    // if (req.body._type == "folder" || req.body._type == "alt_folder") {
    //   await recursiveDelete(fullPath, "Files");
    // }
    // await deleteFile(fullPath, "Files");
    // const result = await prisma.sharedFiles.deleteMany({
    //   where: { sessionId: req.body._sessionId, destinationUser: req.user.id },
    // });
    res.redirect("/account");
  },
];
