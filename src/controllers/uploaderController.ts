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
import { getUserAndOriginalFolderId } from "@/dbMethods/getUserAndOriginalFolderId";

function setNewName(req: Request, file: any) {
  if (req.body.newName) {
    return req.body.newName;
  } else {
    return file.originalname;
  }
}

async function fileUploaderFunction(req: Request, res: Response) {
  try {
    const file = req.file;
    if (!file || file.size == 0) {
      customErrorContainer.fileError("Insert a non empty file");
      return "empty or null file";
    }
    const size = getSize(file.size);

    const newName = setNewName(req, file);
    logger.toImplement("need to add validator to the name of the new file");
    const currentFolderId = req.body._currentFolderId || "Home";

    //Get file type {{{
    const { data: fileType, error: fileTypeError } = await tryCatch(
      getFileType(file),
    ); //does not return type folder
    if (fileTypeError) {
      customErrorContainer.genericError();
      logger.error("There was an error with the filetype");
      return fileTypeError;
    }
    //}}}

    //Getting the user and original folder id, both if user is or is not the owner {{{
    const { data: objectData, error: errorData } = await tryCatch(
      getUserAndOriginalFolderId(req, res, currentFolderId),
    );
    if (
      errorData ||
      objectData.error ||
      !objectData.userId ||
      !objectData.originalFolderId ||
      objectData.userIsOwner == undefined
    ) {
      customErrorContainer.genericError();
      logger.error(
        "error getting user and og folder in fileUploaderFunction : ",
        errorData || objectData.error,
      );
      res.redirect("/");
      return;
    }
    const { userId, userIsOwner, originalFolderId } = objectData;
    //}}}

    const ownerRedirect = userIsOwner ? "0" : "1";

    //Creating for prisma the file and handling error{{{
    const { data: prismaFileList, error: errorPrismaFileList } = await tryCatch(
      prisma.files.create({
        data: {
          ownerId: userId,
          fileName: newName,
          type: fileType,
          size: size,
          parentFolder: originalFolderId,
        },
      }),
    );
    if (errorPrismaFileList || !prismaFileList) {
      customErrorContainer.genericError();
      logger.error(
        `Error creating the file with prisma: ${errorPrismaFileList || "No value"}`,
      );
      return errorPrismaFileList || "Not created";
    }
    //}}}

    //Creating the file for supabaes and handling the error {{{
    const name = `${userId}/Storage/${originalFolderId}/${prismaFileList.id}`;
    logger.toImplement(
      "NEED TO MAKE SURE THE UPLOAD IS DELETED FROM THE SERVER IF THE SUPABASE UPLOAD FAILS",
    );
    const { data: _uploadResult, error: uploadError } = await tryCatch(
      uploadFile(file, "Files", name),
    );
    if (uploadError) {
      logger.error("uploadError: ", uploadError);
      customErrorContainer.genericError();
      return uploadError;
    }
    //}}}

    res.redirect(`/account/${ownerRedirect}/${originalFolderId}`);
  } catch (e) {
    logger.error(e);
  }
}

const fileUploader = [
  uploadFiles.single("usrFile"),
  body("name").escape(),
  async (req: Request, res: Response) => {
    const error = await fileUploaderFunction(req, res);
    if (error) {
      logger.error("Caught an error before redirecting: ", error);
      customErrorContainer.genericError();
      res.redirect("/account");
    }
  },
];
export { fileUploader };
