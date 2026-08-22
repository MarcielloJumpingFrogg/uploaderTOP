import type { Request, Response } from "express";
import multer from "multer";
import "dotenv/config";
import { body, check } from "express-validator";
import { avatarToDb } from "../databaseMethods/toDb";
import { viewFiles } from "../databaseMethods/viewFiles";
import { renderAccount } from "../controllers/accountController";
import customErrorContainer from "../customErrors/customErrorContainer";
import path from "node:path";
import fs from "node:fs";

class FieldTypeError extends Error {
  constructor(message: any) {
    super(message);
    this.name = "FieldTypeError";
  }
}

const fileImageFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
  //only images
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new FieldTypeError("Supposed to Be image"), false);
  }
};

const filesCheck = (req: Request, file: Express.Multer.File, cb: any) => {
  //most stuff
};

function getDestination() {
  if (process.env.NODE_ENV == "test") {
    return "tests/testUploads/";
  } else if (process.env.NODE_ENV == "local") {
    return "uploads/";
  }
}

let uploadFolder: any = getDestination();

const uploadImage = multer({
  dest: uploadFolder,
  fileFilter: fileImageFilter,
  limits: {
    fileSize: 1024 * 1024 * 5,
    files: 1,
    fields: 1,
    fieldNestingDepth: 3,
  },
});
const uploadFiles = multer({
  dest: uploadFolder,
  fileFilter: filesCheck,
  limits: {
    fileSize: 1024 * 1024 * 5,
    files: 1,
    fields: 1,
    fieldNestingDepth: 3,
  },
});

function moveFile(fileName: any, userId: number, destination: string) {
  const homeDir = path.join(__dirname, "../..");
  console.log("dirname", homeDir);
  const oldPath = homeDir + "/" + uploadFolder + fileName;
  const avatarPath = homeDir + "/" + uploadFolder + "users/" + userId;
  fs.mkdirSync(avatarPath + "/" + destination, { recursive: true });
  const newPath = avatarPath + "/" + destination + "/" + fileName;
  console.log("OldPath: ", oldPath);
  console.log("newPath: ", newPath);
  fs.renameSync(oldPath, newPath);
}

const avatarController = [
  uploadImage.single("avatar"),
  body("name").escape(),
  (req: any, res: Response, _next: Function) => {
    // TODO: need to find a way to escape the "original name" of the file before uploading it to the "server" also need to make sure the file is escaped with <%= filename %> to make sure it's only passed as text and not a script

    // console.log("multer user:", req.user)
    avatarToDb(req.file, req.user);
    console.log(req.file);
    moveFile(req.file?.filename, req.user.id, "avatar");

    // customErrorContainer.resetAccount()
    res.redirect("/account");
    // renderAccount(req, res)
  },
];

const handleMulterError = (
  err: Error,
  req: Request,
  res: Response,
  _next: Function,
) => {
  if (err instanceof multer.MulterError || err.name === "FieldTypeError") {
    customErrorContainer.multerError(err, 400);
    renderAccount(req, res);
    // return res.status(400).render("account", {errorName: err.name, errors: [err], user: req.user, files:viewFiles})
  }
};

export { avatarController, handleMulterError, uploadFolder, getDestination };
