import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import customErrorContainer from "../customErrors/customErrorContainer";
import logger from "../../config/logger";
import { tryCatch } from "@/customErrors/tryCatch";

export const addSharedFileCtrl = [
  async (req: Request, res: Response) => {
    try {
      const shareId = req.params[`shareId`];
      if (!shareId || Array.isArray(shareId)) {
        logger.error(`No share id`);
        customErrorContainer.genericError();
        res.redirect(`/`);
        return;
      }
      const shareSession = await prisma.shareSession.findUnique({
        where: {
          id: shareId,
        },
      });
      if (!shareSession) {
        logger.error("No share Session");
        customErrorContainer.databaseError(res);
        return;
      }
      if (!req.user) {
        customErrorContainer.userError(res);
        return;
      }
      const { data: createdShareFile, error: failedToCreateShareFile } =
        await tryCatch(
          prisma.sharedFiles.create({
            data: {
              destinationUser: req.user.id,
              sessionId: shareSession?.id,
            },
          }),
        );

      if (failedToCreateShareFile || !createdShareFile) {
        logger.error("no sharedFile", failedToCreateShareFile || null);
        customErrorContainer.genericError();
        return;
      }

      res.redirect(`/account`);
    } catch (e) {
      logger.error(e);
      customErrorContainer.passportError(e, 400);
      res.redirect(`/account`);
    }
  },
];
