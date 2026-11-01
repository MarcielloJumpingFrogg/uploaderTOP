import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response, Request } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";
import { getSize } from "../fileMethods/getSize";
import { getFileType } from "../fileMethods/getFileType";
import { tryCatch } from "../customErrors/tryCatch";
import { getFromSharedFile } from "../dbMethods/getFromSharedFile";

function setNewName(req: customRequest, file: any) {
  if (req.body.newName) {
    return req.body.newName;
  } else {
    return file.originalname;
  }
}

interface customRequest extends Omit<Request, "user"> {
  user: {
    id: string;
  };
}

async function fileUploaderFunction(req: customRequest, res: Response) {
  try {
    const file = req.file;
    if (!file || file.size == 0) {
      customErrorContainer.fileError("Insert a non empty file");
      return "empty or null file";
    }
    const size = getSize(file.size);

    const newName = setNewName(req, file);
    const isOwner = req.body._isOwner || true;
    const ownerRedirect = isOwner ? "0" : "1";
    const currentFolderId = req.body._currentFolderId || "Home";
    let uploadFolderId: string = "";

    let owner: string = "";
    const { data: fileType, error: fileTypeError } = await tryCatch(
      getFileType(file),
    ); //does not return type folder
    if (fileTypeError) {
      customErrorContainer.genericError();
      logger.error("There was an error with the filetype");
      return fileTypeError;
    }

    if (!req.user || req.user.id == undefined) {
      customErrorContainer.genericError();
      logger.error("No user");
      return "No user";
    }

    if (isOwner) {
      owner = req.user.id;
      uploadFolderId = currentFolderId;
    } else {
      const { data: allInfo, error: currentFolderError } = await tryCatch(
        getFromSharedFile(currentFolderId),
      );
      if (
        currentFolderError ||
        !allInfo ||
        !allInfo.owner ||
        !allInfo.originalFolder
      ) {
        customErrorContainer.genericError();
        logger.error("current Folder Error: ", currentFolderError);
        return currentFolderError;
      }
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
    const { data: _uploadResult, error: uploadError } = await tryCatch(
      uploadFile(file, "Files", name),
    );
    if (uploadError) {
      logger.error("uploadError: ", uploadError);
      customErrorContainer.genericError();
      return uploadError;
    }

    logger.test("_prismaFileList", prismaFileList);
    res.redirect(`/account/${ownerRedirect}/${uploadFolderId}`);
  } catch (e) {
    logger.error(e);
  }
}

const fileUploader = [
  uploadFiles.single("usrFile"),
  body("name").escape(),
  async (req: customRequest, res: Response) => {
    const error = await fileUploaderFunction(req, res);
    if (error) {
      logger.error("Caught an error before redirecting: ", error);
      res.redirect("/account");
    }
  },
];
export { fileUploader };
