import type { Response } from "express";
import "dotenv/config";
import { avatarToDb } from "../databaseMethods/toDb";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadImage } from "./multer";
import { moveFile } from "../fs/fsUtility";

const avatarUploader = [
  uploadImage.single("avatar"),
  (req: any, res: Response, _next: Function) => {
    customErrorContainer.resetError();
    avatarToDb(req.file, req.user);
    moveFile(req.file?.filename, req.user.id, "avatar");

    res.redirect("/account");
  },
];

export { avatarUploader };
