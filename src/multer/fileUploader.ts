import { body } from "express-validator";
import { uploadFiles } from "./multer";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { toDb } from "../databaseMethods/toDb";
import { moveFile } from "../fs/fsUtility";

const fileUploader = [
  uploadFiles.array("usrFile", 50),
  body("name").escape(),
  (req: any, res: Response) => {
    console.log(req.files);
    req.files.forEach((file) => {
      console.log("new file: ", file);
      customErrorContainer.resetError();
      let newName;
      if (req.body.newName) {
        newName = req.body.newName;
      } else {
        newName = file.originalname;
      }
      toDb(file, req.user, newName);
      moveFile(file?.filename, req.user.id, "usrFiles");
    });
    res.redirect("/account");
  },
];
export { fileUploader };
