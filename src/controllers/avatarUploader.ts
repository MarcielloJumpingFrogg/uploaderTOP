import type { Response } from "express";
import "dotenv/config";
// import { avatarToDb } from "../databaseMethods/toDb";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadImage } from "../multer/multer";
import { decode } from "base64-arraybuffer";
import { uploadFile } from "../../supabaseFn/uploadFile";
import { deleteFile } from "../../supabaseFn/deleteFile";
import { readFile } from "../../supabaseFn/readFile";

const avatarUploader = [
  uploadImage.single("avatar"),
  async (req: any, res: Response, _next: Function) => {
    customErrorContainer.resetError();

    // avatarToDb(req.file, req.user);
    //TODO: MoveFile is to be replaced with
    //1: upload to temporary memory
    //2: translated to readable data for supabase
    //3: uploaded to supabase
    //4: removed from temporary memory
    //5: remove avatarToDb

    try {
      const file = req.file;
      if (!file) {
        throw new Error("No file");
      }

      const fileBase64 = decode(file.buffer.toString("base64"));
      const uploadName = "avatars/" + req.user.id;

      // const { data, error } = await readFile("avatar", uploadName);
      // if (error) {
      //   console.error(error);
      // }
      // if (data) {
      //   //TODO: delete file need to be implemented
      //   console.log("delete file need to be implemented");
      //   deleteFile();
      // }
      //
      uploadFile(fileBase64, file, "avatar", uploadName);

      // moveFile(req.file?.filename, req.user.id, "avatar");
    } catch (e) {
      customErrorContainer.multerError(e, 400);
    }

    res.redirect("/account");
  },
];

export { avatarUploader };
