import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import logger from "../../config/logger";
import { renderAccount } from "./accountController";
import customErrorContainer from "@/customErrors/customErrorContainer";
import { tryCatch } from "@/customErrors/tryCatch";

export const shareCreatorController = [
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        logger.error("No user");
        customErrorContainer.passportError("No user", 400);
        res.redirect("/account");
        return;
      }

      const dayInMs = 24 * 60 * 60 * 1000;
      let expiration = 1;
      if (req.body.daysExpiration) {
        expiration = req.body.daysExpiration;
      }
      expiration = expiration * dayInMs;
      const expirationDay = Date.now() + expiration;

      const canBeEdited = req.body.canEdit === "on" ? true : false;

      const { data: dbOriginalFile, error: dbError } = await tryCatch(
        prisma.items.findUnique({
          where: {
            ownerId: req.user.id,
            id: req.body._fileId,
            parentFolder: req.body._parentFolder,
          },
        }),
      );

      if (dbError || !dbOriginalFile) {
        logger.error("Error while getting the db's original file: ", dbError);
        customErrorContainer.genericError();
        res.redirect("/account");
        return;
      }

      const { data: shareSessionResult, error: shareSessionError } =
        await tryCatch(
          prisma.shareSession.create({
            data: {
              originalUser: req.user.id,
              originalFile: dbOriginalFile.id,
              expiration: new Date(expirationDay),
              edit: canBeEdited,
            },
          }),
        );

      if (shareSessionError || !shareSessionResult) {
        logger.error(
          "Error while creating a shareSession: ",
          shareSessionError || null,
        );
        customErrorContainer.genericError();
        res.redirect("/");
        return;
      }

      req.popUp = {
        title: "Url: ",
        text: "http://localhost:8080/share/add/" + shareSessionResult.id,
      };
    } catch (e) {
      logger.error("Error: ", e);
    }
    res.location("/account/0/Home");
    renderAccount(req, res);
  },
];
