import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { admin_supabase } from "../../config/supabase";
import logger from "../../config/logger";
import { renderAccount } from "./accountController";
import { readFolder } from "../supabaseFn/readFolder";
export const shareCreatorController = [
  async (req: Request, res: Response) => {
    try {
      let itemName = "";
      console.log("req.body.shareCreatorController: ", req.body);
      if (!req.body._path) {
        const currentPath = req.body._location.replaceAll(",", "/");
        itemName = req.user.id + "/" + currentPath + "/" + req.body._name;
      } else {
        itemName = req.body._path;
      }

      const pullResult = await admin_supabase.storage
        .from("Files")
        .info(itemName);

      logger.error("Gotta change some stuff sleepy");
      const readFolderResult = await readFolder(itemName, "Files", "user");
      console.log("readFolderResult", readFolderResult);
      console.log("pullResult", pullResult);

      const dayInMs = 24 * 60 * 60 * 1000;
      let expiration = 1;
      if (req.body.daysExpiration) {
        expiration = req.body.daysExpiration;
      }
      expiration = expiration * dayInMs;
      const expirationDay = Date.now() + expiration;

      const canBeEdited = req.body.canEdit === "on" ? true : false;

      const prismaResult = await prisma.shareSession.create({
        data: {
          originalUser: req.user.id,
          filePath: itemName,
          expiration: new Date(expirationDay),
          type: pullResult.data?.contentType,
          edit: canBeEdited,
        },
      });

      req.popUp = {
        title: "Url: ",
        text: "http://localhost:8080/share/add/" + prismaResult.id,
      };
    } catch (e) {
      logger.error("Error: ", e);
    }
    renderAccount(req, res);
  },
];
