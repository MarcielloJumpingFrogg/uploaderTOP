import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response, Request } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";
import { createFolder } from "../supabaseFn/createFolder";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";
import { getSize } from "../fileMethods/getSize";
import { getFileType } from "../fileMethods/getFileType";

// async function folderTreeCreator(
//   newName: string,
//   partialLocation: string,
//   userId: string,
// ) {
//   const fullName = newName.split("/");
//   for (let i = 0; i < fullName.length - 1; i++) {
//     let folderLocation = partialLocation;
//     for (let j = 0; j <= i; j++) {
//       folderLocation += fullName[j] + "/";
//     }
//     logger.test("folderLocation: ", folderLocation);
//     createFolder(folderLocation, "Files");
//     const _createFolderInFiles = await prisma.files.create({
//       data: {
//         path: folderLocation,
//         fileName: newName,
//         type: "folder",
//         ownerId: userId,
//       },
//     });
//   }
// }

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
  uploadFiles.single("usrFile"),
  body("name").escape(),
  async (req: any, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        throw new Error("There is no file");
      }
      const size = getSize(file.size);

      const newName = setNewName(req, file);
      const isOwner = req.body._isOwner || true;
      const currentFolderId = req.body._currentFolderId || "Home";

      let currentFolder;
      let owner;

      logger.test("QeQU");

      logger.test("file: ", file);
      let fileType = await getFileType(file);
      logger.test("fileType: ", fileType);

      logger.test("QUQU");

      if (isOwner) {
        logger.test("QaQU");
        currentFolder = await prisma.files.findUniqueOrThrow({
          where: { ownerId: req.user.id, id: currentFolderId },
        });
        owner = req.user.id;
      } else {
        logger.test("QUQo");
        const sharedFile = await prisma.sharedFiles.findUniqueOrThrow({
          where: { id: currentFolder },
        });
        const session = await prisma.shareSession.findUniqueOrThrow({
          where: { id: sharedFile?.sessionId },
        });
        currentFolder = await prisma.files.findUniqueOrThrow({
          where: { id: session?.originalFile },
        });
        owner = currentFolder.ownerId;
      }
      logger.test("currentFolder: ", currentFolder);

      // const location = req.body._location.replaceAll(",", "/");
      // const partialLocation = ownerId + "/" + location + "/";
      // await folderTreeCreator(newName, partialLocation, ownerId);

      const uploadName = newName;
      // const uploadFileResult = await uploadFile(file, "Files", uploadName);

      // if (!uploadFileResult) {
      //   throw new Error("No Upload File Result");
      // }
      const _prismaFileList = await prisma.files.create({
        data: {
          ownerId: owner,
          fileName: uploadName,
          type: fileType,
          size: size,
          parentFolder: currentFolder.id,
        },
      });
      logger.test("_prismaFileList", _prismaFileList);
    } catch (e) {
      logger.error(e);
    }
    res.redirect("/account");
  },
];
export { fileUploader };
