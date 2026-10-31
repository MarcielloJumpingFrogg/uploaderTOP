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
import { tryCatch } from "../customErrors/tryCatch";
import { fileTypeFromBuffer } from "file-type";
import { getFromSharedFile } from "../dbMethods/getFromSharedFile";

function setNewName(req: Request, file: any) {
  if (req.body.newName) {
    return req.body.newName;
  } else {
    return file.originalname;
  }
}

const fileUploader = [
  uploadFiles.single("usrFile"),
  body("name").escape(),
  async (req: any, res: Response) => {
    try {
      const file = req.file;
      if (!file || file.size == 0) {
        throw new Error("Insert a non empty file");
      }
      const size = getSize(file.size);

      const newName = setNewName(req, file);
      const isOwner = req.body._isOwner || true;
      const ownerRedirect = isOwner ? "0" : "1";
      const currentFolderId = req.body._currentFolderId || "Home";
      let uploadFolderId: string = "";

      let owner;
      const { data: fileType, error: fileTypeError } = await tryCatch(
        getFileType(file),
      ); //does not return type folder
      if (fileTypeError) {
        throw new Error("FileTypeError: ", fileTypeError);
      }

      if (isOwner) {
        owner = req.user.id;
        uploadFolderId = currentFolderId;
      } else {
        const { data: allInfo, error: currentFolderError } = await tryCatch(
          getFromSharedFile(currentFolderId),
        );
        if (currentFolderError) return { error: currentFolderError };
        owner = allInfo?.owner;
        uploadFolderId = allInfo.originalFolder.id;
      }

      const prismaFileList = await prisma.files.create({
        data: {
          ownerId: owner,
          fileName: newName,
          type: fileType,
          size: size,
          parentFolder: uploadFolderId,
        },
      });

      const name = `${owner}/Storage/${uploadFolderId}/${prismaFileList.id}`;
      const { data: uploadResult, error: uploadError } = await tryCatch(
        uploadFile(file, "Files", name),
      );
      if (uploadError) throw new Error("Error While uploading");

      logger.test("_prismaFileList", prismaFileList);
      res.redirect(`/account/${ownerRedirect}/${uploadFolderId}`);
    } catch (e) {
      logger.error(e);
    }
  },
];
export { fileUploader };
