import type { Request, Response } from "express";
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
            const addSharedFile = await prisma.sharedFiles.create({
              data: {
                originalUser: shareSession?.originalUser,
                destinationUser: req.user.id,
                expiration: shareSession?.expiration,
                sessionId: shareSession?.id,
              },
            });

            const pathShareSession = shareSession.filePath.split("/");
            const fileName = pathShareSession[pathShareSession.length - 1];
            const someResult = await prisma.files.create({
              data: {
                fileId: shareSession.id,
                path: shareSession.filePath,
                fileName: fileName,
                mimetype: shareSession.type,
                size: 10,
                uploadTime: new Date(),
                currentUser: req.user.id,
                ownerId: shareSession.originalUser,
              },
            });

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

/*
model Files {
  id          String  @id @default(uuid())
  fileId      String
  path        String  @unique
  fileName    String  //not sure if it's usefull if i already have the id but okay, maybe for the locally saved files
  mimetype    String
  size        Int
  uploadTime  DateTime @default(now())
  currentUser String
  ownerId     String
  owner       Users   @relation(fields: [currentUser], references: [id])
}



model ShareSession {
  id            String @id @default(uuid())
  originalUser  String
  creator       Users @relation(fields: [originalUser], references: [id])
  expiration    DateTime @default(now())
  filePath      String
  type          String
  edit          Boolean
  sharedFiles   SharedFiles[]
}
 * */
