import type { Response } from "express";
import "dotenv/config";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadImage } from "../multer/multer";
import { uploadAvatar } from "../supabaseFn/uploadAvatar";
import { fileTypeFromBuffer } from "file-type";
import { tryCatch } from "../customErrors/tryCatch";

const avatarUploader = [
  uploadImage.single("avatar"),
  async (req: any, res: Response, _next: Function) => {
    customErrorContainer.resetError();
    try {
      const file = req.file;
      if (!file || file.size == 0) {
        throw new Error("No file");
      }
      const { data: fileType, error: fileTypeError } = await tryCatch(
        fileTypeFromBuffer(file.buffer),
      );
      const allowedTypes = ["jpg", "png", "jpeg", "svg"];
      if (fileType === undefined || fileType === null)
        throw new Error("File type undefined or null");
      if (fileTypeError) throw new Error("FileTypeError: ", fileTypeError);

      if (!allowedTypes.includes(fileType.ext))
        throw new Error("Supposed to be an image");

      const _uploadName = "avatars/" + req.user.id;

      // await uploadFile(file, "avatar", uploadName);
      await uploadAvatar(file, req.user.id);
    } catch (e) {
      customErrorContainer.multerError(e, 400);
    }

    res.redirect("/account");
  },
];

export { avatarUploader };
