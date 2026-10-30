import { renderAccount } from "./accountController";
import { prisma } from "../../lib/prisma";
import type { Request, Response } from "express";
import logger from "../../config/logger";

const folderVisualizer = [
  async (req: any, res: Response) => {
    try {
      const folderId = req.params.folderId;
      const owned = req.params.owned;
      let userOwner = owned == "0" ? true : false;
      req.currentFolderId = folderId;
      req.userOwner = userOwner;
      renderAccount(req, res);
    } catch (e) {
      logger.error(e);
    }
  },
];

export { folderVisualizer };
