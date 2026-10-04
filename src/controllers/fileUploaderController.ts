import { body } from "express-validator";
import { uploadFiles } from "../multer/multer";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";
import { uploadFile } from "../supabaseFn/uploadFile";

const fileUploader = [
  uploadFiles.array("usrFile", 50),
  body("name").escape(),
  async (req: any, res: Response) => {
    req.files.forEach(async (file: any) => {
      customErrorContainer.resetError();
      let newName;
      if (req.body.newName) {
        newName = req.body.newName;
      } else {
        newName = file.originalname;
      }
      const location = req.body._location.replaceAll(",", "/");

      const uploadName = req.user.id + "/" + location + "/" + newName;
      await uploadFile(file, "Files", uploadName, req.user.id);
    });
    const pathArray = req.body._location.split(",");
    let fullPath = "";
    for (let i = 0; i < pathArray.length; i++) {
      if (i != 0) {
        fullPath += "@";
      }
      fullPath += pathArray[i];
    }
    res.redirect("/account/" + fullPath);
  },
];
export { fileUploader };
