import { body } from "express-validator";
import { uploadFiles } from "./multer";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { toDb } from "../databaseMethods/toDb";
import { moveFile } from "../fs/fsUtility";

const fileUploader = [
  uploadFiles.single("usrFile"),
  body("name").escape(),
  (req: any, res: Response) => {
    customErrorContainer.resetError();
    let newName;
    console.log("new file: ", req.file);
    if (req.body.newName) {
      newName = req.body.newName;
    } else {
      newName = req.file.originalname;
    }
    toDb(req.file, req.user, newName);
    moveFile(req.file?.filename, req.user.id, "usrFiles");
    res.redirect("/account");
  },
];
export { fileUploader };
