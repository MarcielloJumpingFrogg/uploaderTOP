// import { admin_supabase } from "../../config/supabase";
import { deleteFile } from "../supabaseFn/deleteFile";
import { recursiveDelete } from "../supabaseFn/recursiveDelete";
import type { Response } from "express";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

export const fileDeleteController = [
  async (req: any, res: Response) => {
    if (req.body._sessionId === "0" || !req.body._sessionId) {
      const location = req.body._location.replaceAll(",", "/");
      let owner;
      if (req.body._folderOwner === "0" || !req.body._folderOwner) {
        owner = req.user.id;
      } else {
        owner = req.body._folderOwner;
      }
      const fullPath = owner + "/" + location + "/" + req.body._name;
      if (req.body._type == "folder" || req.body._type == "alt_folder") {
        await recursiveDelete(fullPath, "Files");
      }
      await deleteFile(fullPath, "Files");
    } else {
      const result = await prisma.sharedFiles.deleteMany({
        where: { sessionId: req.body._sessionId, destinationUser: req.user.id },
      });
    }
    res.redirect("/account");
  },
];
