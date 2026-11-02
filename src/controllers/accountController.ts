import { getAvatar } from "../supabaseFn/getAvatar";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import "colors";
import logger from "../../config/logger";
import { getOwnedFiles } from "../dbMethods/getOwnedFiles";
import { getSharedFiles } from "../dbMethods/getSharedFiles";
import { prisma } from "../../lib/prisma";
import { tryCatch } from "../customErrors/tryCatch";

async function renderAccount(req: any, res: Response) {
  try {
    //refresh cookies
    const month = 1000 * 60 * 60 * 24 * 30;
    req.session.cookie.maxAge = month;

    //approximate the currentFolder's id
    let currentFolderId = req.currentFolderId || "Home";

    //user
    let user;
    if (req.userOwner) {
      user = req.userOwner == true ? req.user.id : "0";
    } else {
      user = req.user.id;
    }
    //

    //avatar
    const { data: avatar, error: avatarError } = await tryCatch(
      getAvatar(req.user.id),
    );
    if (avatarError) throw new Error("error getting avatar: ", avatarError);
    //

    //ownedFiles:
    const { data: ownedFiles, error: ownedFilesError } = await tryCatch(
      getOwnedFiles(user, currentFolderId),
    );
    if (ownedFilesError)
      throw new Error(
        "Error getting the files owned by the user",
        ownedFilesError,
      );
    //

    //sharedFiles:
    const { data: sharedFiles, error: sharedFilesError } = await tryCatch(
      getSharedFiles(user, currentFolderId),
    );
    if (sharedFilesError) {
      logger.error(sharedFilesError);
      throw new Error("sharedFileError: ", sharedFilesError);
    }
    //

    //folder:
    let folder;
    if (currentFolderId == "Home") {
      folder = currentFolderId;
    } else {
      let { data: parentFolder, error: parentFolderError } = await tryCatch(
        prisma.files.findFirst({
          where: { id: currentFolderId, ownerId: user },
        }),
      );
      if (parentFolderError)
        throw new Error(
          "Could not find parentFolder's id: ",
          parentFolderError,
        );
      if (parentFolder == undefined || parentFolder.parentFolder == undefined)
        throw new Error("No parent folder found");
      folder = parentFolder.parentFolder;
    }
    //

    let popUp = req.popUp || {};

    res.status(customErrorContainer.getErrorCode()).render("account", {
      //user and file data
      user: req.user,
      isOwner: req.userOwner || true,
      ownedFiles: ownedFiles,
      sharedFiles: sharedFiles,
      parentFolderId: folder,
      currentFolderId: currentFolderId,
      avatar: avatar,
      popUp: popUp,

      //error management
      errorName: customErrorContainer.getErrorName(),
      errors: customErrorContainer.getErrorList(),
    });
  } catch (e) {
    logger.error("Error:", e);
  }
}

const accountController = [
  async (req: any, res: Response) => {
    if (!req.user) {
      res.redirect("/");
    }
    await renderAccount(req, res);
  },
];

export { accountController, renderAccount };
