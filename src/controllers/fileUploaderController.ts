import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response, Request } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";
import { createFolder } from "../supabaseFn/createFolder";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";
import { getSize } from "../fileMethods/getSize";

async function folderTreeCreator(newName: string, partialLocation: string, userId: string) {
  const fullName = newName.split("/");
  for (let i = 0; i < fullName.length - 1; i++) {
    let folderLocation = partialLocation;
    for (let j = 0; j <= i; j++) {
      folderLocation += fullName[j] + "/";
    }
    createFolder(folderLocation, "Files");
    const _createFolderInFiles = await prisma.files.create({
      data: {
        path: folderLocation,
        fileName: newName,
        mimetype: "folder",
        size: "-",
        currentUser: userId,
        ownerId: userId,
        sessionId: "0"
      }
    })
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
    try {

    req.files.forEach(async (file: any) => {
      customErrorContainer.resetError();
      const newName = setNewName(req, file);
      const location = req.body._location.replaceAll(",", "/");
      const partialLocation = req.user.id + "/" +  location + "/";
      await folderTreeCreator(newName, partialLocation, req.user.id);

      const uploadName = partialLocation + newName;
      const uploadFileResult = await uploadFile(file, "Files", uploadName);
      if (!uploadFileResult) {
        throw new Error("No Upload File Result")
      }
      const size = getSize(file)
      const _prismaFileList = await prisma.files.create({
        data: {
          path: uploadFileResult?.data?.path || "Home",
          fileName: uploadName,
          mimetype: file.mimetype,
          size: size,
          currentUser: req.user.id,
          ownerId: req.user.id,
          sessionId: "0",
        },
      });
    });
    } catch (e) {
      logger.error(e)
    }
    res.redirect("/account" );
  },
];
export { fileUploader };
