import { getAvatar } from "../supabaseFn/getAvatar";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { getFiles } from "../dbMethods/getFiles";
import { getFileList } from "../fileMethods/getFileList";
import "colors";

async function renderAccount(req: any, res: Response) {
  let tempPath = ["Home"];
  if (req.currentPath !== undefined) {
    tempPath = req.currentPath;
  }

  let fullPath = "";
  for (let i = 0; i < tempPath.length; i++) {
    fullPath += tempPath[i] + "/";
  }
  const avatar = await getAvatar(req.user.id);
  const files = await getFiles(req.user.id, fullPath);
  const fileList: {
    id: string;
    type: string;
    name: string;
  }[] = await getFileList(files);

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
    path: tempPath,
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
