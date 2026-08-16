import { getAvatar, viewFiles } from "../databaseMethods/viewFiles";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";

async function renderAccount(req: any, res: Response) {
  const file = await viewFiles(req.user.id);
  const avatar = await getAvatar(req.user.id);
  res
    .status(customErrorContainer.getErrorCode())
    .render("account", {
      user: req.user,
      files: file,
      errorName: customErrorContainer.getErrorName(),
      errors: customErrorContainer.getErrorList(),
      avatar: avatar,
    });
}

const accountController = [
  async (req: any, res: Response) => {
    // const file = await viewFiles(req.user.id)
    await renderAccount(req, res);
  },
];

export { accountController, renderAccount };
