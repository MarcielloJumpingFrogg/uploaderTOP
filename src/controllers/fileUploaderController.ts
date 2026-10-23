import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response, Request } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";
import { createFolder } from "../supabaseFn/createFolder";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";
import { getSize } from "../fileMethods/getSize";

async function folderTreeCreator(
  newName: string,
  partialLocation: string,
  userId: string,
) {
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
        sessionId: "0",
      },
    });
  }
}

function setNewName(req: Request, file: any) {
  if (req.body.newName) {
    return req.body.newName;
  } else {
    return file.originalname;
  }
}

async function setOwnerId(req: any, folderSession: string) {
  let ownerId;
  if (folderSession != req.user.id) {
    const _temp = await prisma.shareSession.findFirst({
      where: { id: folderSession },
    });
    ownerId = _temp?.originalUser;
  } else {
    ownerId = req.user.id;
  }
  return ownerId;
}

function setFolderSession(req: any) {
  let folderSession;
  if (
    req.body._folderSession === "0" ||
    req.body._folderSession === undefined
  ) {
    folderSession = req.user.id;
  } else {
    folderSession = req.body._folderSession;
  }

  return folderSession;
}

const fileUploader = [
  uploadFiles.array("usrFile", 50),
  body("name").escape(),
  async (req: any, res: Response) => {
    try {
      req.files.forEach(async (file: any) => {
        const folderSession = setFolderSession(req);
        const ownerId = await setOwnerId(req, folderSession);
        customErrorContainer.resetError();
        const newName = setNewName(req, file);
        const location = req.body._location.replaceAll(",", "/");
        const partialLocation = ownerId + "/" + location + "/";
        await folderTreeCreator(newName, partialLocation, ownerId);

        const uploadName = partialLocation + newName;
        const uploadFileResult = await uploadFile(file, "Files", uploadName);
        if (!uploadFileResult) {
          throw new Error("No Upload File Result");
        }
        const size = getSize(file);
        const _prismaFileList = await prisma.files.create({
          data: {
            path: uploadFileResult?.data?.path || "Home",
            fileName: uploadName,
            mimetype: file.mimetype,
            size: size,
            currentUser: req.user.id,
            ownerId: ownerId,
            sessionId: "0",
          },
        });
      });
    } catch (e) {
      logger.error(e);
    }
    res.redirect("/account");
  },
];
export { fileUploader };
