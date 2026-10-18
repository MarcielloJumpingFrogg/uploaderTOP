import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import customErrorContainer from "../customErrors/customErrorContainer";
import logger from "../../config/logger";

export const addSharedFileCtrl = [
  async (req: any, res: Response) => {
    // res.redirect("/account");
    try {
      const shareId = req.params.shareId;
      if (!shareId) {
        throw new Error("!shareId");
      } else {
        const shareSession = await prisma.shareSession.findUnique({
          where: {
            id: shareId,
          },
        });
        if (!shareSession) {
          throw new Error("!shareSession");
        } else {
          if (req.user.id === undefined) {
            throw new Error("!req.user.id");
          } else {
            const __addSharedFile = await prisma.sharedFiles.create({
              data: {
                originalUser: shareSession?.originalUser,
                destinationUser: req.user.id,
                expiration: shareSession?.expiration,
                fileType: shareSession.type,
                fileName: shareSession.fileName,
                sessionId: shareSession?.id,
              },
            });

            // const _someResult = await prisma.files.create({
            //   data: {
            //     fileId: shareSession.id,
            //     path: shareSession.filePath,
            //     fileName: shareSession.fileName,
            //     mimetype: shareSession.type,
            //     size: 10,
            //     uploadTime: new Date(),
            //     currentUser: req.user.id,
            //     ownerId: shareSession.originalUser,
            //   },
            // });

            res.redirect("/account");
          }
        }
      }
    } catch (e) {
      logger.error(e);
      customErrorContainer.passportError(e, 400);
      res.redirect("/account");
    }
  },
];
