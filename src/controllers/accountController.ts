import { getAvatar } from "../supabaseFn/getAvatar";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { getFiles } from "../dbMethods/getFiles";
import { getFileList } from "../fileMethods/getFileList";
import "colors";
import logger from "../../config/logger";

async function renderAccount(req: any, res: Response) {

  let currentPath = req.user.id + "/Home"
  if (req.currentPath !== undefined) {
    currentPath = req.currentPath
  }

  const avatar = await getAvatar(req.user.id);
  const files = await getFiles(req.user.id, currentPath);
  const fileList: any[] = await getFileList(files);

  let popUp = {};
  if (req.popUp) {
    popUp = req.popUp;
  }
  res.status(customErrorContainer.getErrorCode()).render("account", {
    user: req.user,
    files: fileList,
    errorName: customErrorContainer.getErrorName(),
    errors: customErrorContainer.getErrorList(),
    avatar: avatar,
    path: currentPath,
    popUp: popUp,
  });
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
