import type { Response } from "express";
import "dotenv/config";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadImage } from "../multer/multer";
import { decode } from "base64-arraybuffer";
import { uploadFile } from "../supabaseFn/uploadFile";

const avatarUploader = [
  uploadImage.single("avatar"),
  async (req: any, res: Response, _next: Function) => {
    customErrorContainer.resetError();

    try {
      const file = req.file;
      if (!file) {
        throw new Error("No file");
      }

      const uploadName = "avatars/" + req.user.id;

      await uploadFile(file, "avatar", uploadName, req.user.id);
    } catch (e) {
      customErrorContainer.multerError(e, 400);
    }

    res.redirect("/account");
  },
];

export { avatarUploader };
