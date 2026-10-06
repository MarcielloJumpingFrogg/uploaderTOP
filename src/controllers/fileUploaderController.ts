import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response, Request } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";
import { createFolder } from "../supabaseFn/createFolder";
import { getFullPath } from "../functions/getFullPath";

function folderTreeCreator(newName: string, partialLocation: string) {
  const fullName = newName.split("/");
  for (let i = 0; i < fullName.length - 1; i++) {
    let folderLocation = partialLocation;
    for (let j = 0; j <= i; j++) {
      folderLocation += fullName[j] + "/";
    }
    createFolder(folderLocation, "Files");
  }
}

function setNewName(req: Request, file: any) {
  if (req.body.newName) {
    return req.body.newName;
  } else {
    return file.originalname;
  }
}

const fileUploader = [
  uploadFiles.array("usrFile", 50),
  body("name").escape(),
  async (req: any, res: Response) => {
    req.files.forEach(async (file: any) => {
      customErrorContainer.resetError();
      const newName = setNewName(req, file);
      const location = req.body._location.replaceAll(",", "/");
      const partialLocation = req.user.id + "/" + location + "/";
      folderTreeCreator(newName, partialLocation);

      const uploadName = partialLocation + newName;
      await uploadFile(file, "Files", uploadName);
    });
    const fullPath = getFullPath(req);
    res.redirect("/account" + fullPath);
  },
];
export { fileUploader };
