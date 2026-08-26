import type { Request, Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import multer from "multer";
import { viewFiles } from "../databaseMethods/viewFiles";
import { renderAccount } from "../controllers/accountController";

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
  cb(null, true);
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
    files: 100,
    fields: 1,
    fieldNestingDepth: 3,
  },
});

const handleMulterError = (
  err: Error,
  req: Request,
  res: Response,
  _next: Function,
) => {
  if (err instanceof multer.MulterError || err.name === "FieldTypeError") {
    customErrorContainer.multerError(err, 400);
    renderAccount(req, res);
  }
};

export {
  uploadImage,
  uploadFolder,
  handleMulterError,
  getDestination,
  uploadFiles,
};
