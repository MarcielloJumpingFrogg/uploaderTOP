import { getAvatar } from "../supabaseFn/getAvatar";
import type { Request, Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import logger from "../../config/logger";
import { tryCatch } from "../customErrors/tryCatch";
import { getAllFiles } from "@/dbMethods/getAllFiles";
import { getUserAndOriginalFolderId } from "@/dbMethods/getUserAndOriginalFolderId";
import { prisma } from "@prisma";

async function renderAccount(req: Request, res: Response) {
  try {
    const { data: objectData, error: errorData } = await tryCatch(
      getUserAndOriginalFolderId(req, res, req.currentFolderId),
    );
    if (
      errorData ||
      objectData.error ||
      !objectData.userId ||
      !objectData.originalFolderId ||
      !objectData.userIsOwner
    ) {
      customErrorContainer.genericError();
      logger.error(
        "error getting user and og folder: ",
        errorData || objectData.error,
      );
      res.redirect("/");
      return;
    }
    const { userId, userIsOwner, originalFolderId } = objectData;
    logger.test("objectData: ", objectData);

    //refresh cookies
    try {
      const month = 1000 * 60 * 60 * 24 * 30;
      req.session.cookie.maxAge = month;
    } catch (e) {
      throw Error(`could not update cookie maxAge: ${e}`);
    }

    if (!req.user) {
      customErrorContainer.userError(res);
      return;
    }

    //avatar
    const { data: avatar, error: avatarError } = await tryCatch(
      getAvatar(req.user.id),
    );
    if (avatarError) throw new Error("error getting avatar: ", avatarError);
    //

    const { data: allfiles, error: errorWithFiles } = await tryCatch(
      getAllFiles(req, res),
    );
    if (errorWithFiles || !allfiles) {
      logger.error(`error getting 'allFiles': ${errorWithFiles || "empty"}`);
      customErrorContainer.genericError();
      res.redirect("/");
      return;
    }

    const { finalSharedFiles, ownedFiles } = allfiles;

    //folder:
    let parentFolderId;
    const { data: orginalFolder, error: errorOriginalFolder } = await tryCatch(
      prisma.files.findUnique({ where: { id: originalFolderId } }),
    );
    if (errorOriginalFolder) {
      logger.error("Error getting originalFolder: ", errorOriginalFolder);
      customErrorContainer.genericError();
      res.redirect("/");
      return;
    }
    parentFolderId = orginalFolder?.parentFolder || "Home";

    let popUp = req.popUp || {};

    res.status(customErrorContainer.getErrorCode()).render("account", {
      //user and file data
      user: req.user,
      isOwner: req.userIsOwner || true,
      ownedFiles: ownedFiles,
      sharedFiles: finalSharedFiles,
      parentFolderId: parentFolderId,
      currentFolderId: req.currentFolderId || "Home",
      avatar: avatar,
      popUp: popUp,

      //error management
      errorName: customErrorContainer.getErrorName(),
      errors: customErrorContainer.getErrorList(),
    });
    customErrorContainer.resetError();
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
