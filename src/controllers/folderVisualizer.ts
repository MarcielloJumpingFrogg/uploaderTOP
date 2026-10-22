import { renderAccount } from "./accountController";
import { prisma } from "../../lib/prisma";
import type { Request, Response } from "express";
import logger from "../../config/logger";

const folderVisualizer = [
  async (req: any, res: Response) => {
    try {
      const paramId = req.params.id;
      const paramPath = req.params.path;
      const adjustedPath = paramPath.replaceAll("@", "/");
      req.currentPath = adjustedPath;
      let folderOwner;
      if (paramId == "0") {
        folderOwner = req.user.id;
      } else {
        const shareSessionResult = await prisma.shareSession.findUnique({
          where: { id: paramId },
        });
        folderOwner = shareSessionResult?.originalUser;
        req.folderSession = paramId;
      }
      req.folderOwner = folderOwner;
      renderAccount(req, res);
    } catch (e) {
      logger.error(e);
    }
  },
];

export { folderVisualizer };
