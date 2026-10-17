import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response, Request } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";
import { createFolder } from "../supabaseFn/createFolder";
import { getFullPath } from "../functions/getFullPath";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";

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
      const partialLocation =  location + "/";
      folderTreeCreator(newName, partialLocation);


      const uploadName = partialLocation + newName;
      const uploadFileResult = await uploadFile(file, "Files", uploadName);
      const _prismaFileList = await prisma.files.create({
        data: {
          path: uploadFileResult?.data?.path,
          fileName: uploadName,
          fileId: uploadFileResult?.data?.id,
          mimetype: file.mimetype,
          size: file.size,
          currentUser: req.user.id,
          ownerId: req.user.id,
        },
      });
      // console.log(
      //   "uploadFileResult",
      //   uploadFileResult,
      //   "file",
      //   file,
      //   "uploadName",
      //   uploadName,
      // );
    });
    // const fullPath = getFullPath(req);
    res.redirect("/account" );
  },
];
export { fileUploader };

/*
 * {
  fileId      String  @id @default(uuid())
  path        String  @unique
  fileName    String  //not sure if it's usefull if i already have the id but okay, maybe for the locally saved files
  mimetype    String
  size        Int
  uploadTime  DateTime @default(now())
  currentUser String
  ownerId     String
  owner       Users   @relation(fields: [currentUser], references: [id])
}
 * */
