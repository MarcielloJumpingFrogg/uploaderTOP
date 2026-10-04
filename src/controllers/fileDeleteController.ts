import { admin_supabase } from "../../config/supabase";
import { deleteFile } from "../supabaseFn/deleteFile";
import { recursiveDelete } from "../supabaseFn/recursiveDelete";
import type { Request, Response } from "express";
import { uploadFile } from "../supabaseFn/uploadFile";

export const fileDeleteController = [
  async (req: Request, res: Response) => {
    const location = req.body._currentPath.replaceAll(",", "/");
    const fullPath = req.user.id + "/" + location + "/" + req.body._name;
    console.log(req.body);
    if (req.body._type == "folder" || req.body._type == "alt_folder") {
      await recursiveDelete(fullPath, "Files");
    }
    await deleteFile(fullPath, "Files");
    res.redirect("/account");
  },
];
