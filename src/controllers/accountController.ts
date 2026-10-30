import { getAvatar } from "../supabaseFn/getAvatar";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import "colors";
import logger from "../../config/logger";
import { getOwnedFiles } from "../dbMethods/getOwnedFiles";
import { getSharedFiles } from "../dbMethods/getSharedFiles";
import { prisma } from "../../lib/prisma";

async function renderAccount(req: any, res: Response) {
  try {
    let currentPath = "Home";
    if (req.currentPath !== undefined) {
      currentPath = req.currentPath;
    }

    const month = 1000 * 60 * 60 * 24 * 30;
    req.session.cookie.maxAge = month;

    // let folderOwner = req.folderOwner || req.user.id;
    // let pathToExtract = req.pathToExtract || currentPath;
    let currentFolderId = req.currentFolderId || "Home";
    let user;

    if (req.userOwner) {
      user = req.userOwner == true ? req.user.id : "0";
    } else {
      user = req.user.id;
    }
    const avatar = await getAvatar(req.user.id);
    const ownedFiles = await getOwnedFiles(user, currentFolderId);
    const sharedFiles = await getSharedFiles(user, currentFolderId);

    const parentFolderId = (
      await prisma.files.findFirst({
        where: { id: currentFolderId, ownerId: user },
      })
    )?.parentFolder;

    // const fileList: any[] = await getFileList(files);

    let popUp = {};
    if (req.popUp) {
      popUp = req.popUp;
    }

    logger.test("currentFolderId", currentFolderId);

    res.status(customErrorContainer.getErrorCode()).render("account", {
      user: req.user,
      isOwner: req.userOwner || true,
      parentFolderId: parentFolderId,
      currentFolderId: currentFolderId,
      avatar: avatar,
      popUp: popUp,

      //error management
      errorName: customErrorContainer.getErrorName(),
      errors: customErrorContainer.getErrorList(),
    });
  } catch (e) {
    logger.error("error:", e);
  }
}

/*
 user: req.user,
    // files: fileList,
    errorName: customErrorContainer.getErrorName(),
    errors: customErrorContainer.getErrorList(),
    avatar: avatar,
    // folderSession: req.folderSession || "0",
    // folderOwner: req.user.id === folderOwner ? "0" : folderOwner,
    // path: pathToExtract,
    popUp: popUp,
 * */

const accountController = [
  async (req: any, res: Response) => {
    if (!req.user) {
      res.redirect("/");
    }
    await renderAccount(req, res);
  },
];

export { accountController, renderAccount };
