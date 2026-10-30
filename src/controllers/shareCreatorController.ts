import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";
import { renderAccount } from "./accountController";
export const shareCreatorController = [
  async (req: Request, res: Response) => {
    try {
      let itemName = "";
      if (!req.body._path) {
        const currentPath = req.body._location.replaceAll(",", "/");
        itemName = req.user.id + "/" + currentPath + "/";
      } else {
        itemName = req.body._path;
      }

      let fileType;
      if (req.body._fileType) {
        fileType = req.body._fileType;
      } else {
        logger.error("MISSING FILETYPE IN THE REQUEST BODY");
        fileType = "other";
      }

      const dayInMs = 24 * 60 * 60 * 1000;
      let expiration = 1;
      if (req.body.daysExpiration) {
        expiration = req.body.daysExpiration;
      }
      expiration = expiration * dayInMs;
      const expirationDay = Date.now() + expiration;

      let canBeEdited = false;
      if (req.body.canEdit) {
        canBeEdited = req.body.canEdit === "on" ? true : false;
      }
      logger.toImplement("prisma.shareSession.create is missing");
      // const prismaResult = await prisma.shareSession.create({
      //   data: {
      //     originalUser: req.user.id,
      //     expiration: new Date(expirationDay),
      //     edit: canBeEdited,
      //   },
      // });

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
