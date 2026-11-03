import { renderAccount } from "./accountController";
import type { Request, Response } from "express";
import logger from "../../config/logger";

const folderVisualizer = [
  async (req: Request, res: Response) => {
    try {
      let folderId = req.params[`folderId`];
      const owned = req.params[`owned`];
      let userIsOwner;
      if (owned === "0") {
        userIsOwner = true;
      } else if (owned === "1") {
        userIsOwner = false;
      }
      if (!folderId || Array.isArray(folderId)) {
        folderId = "Home";
      }
      req.currentFolderId = folderId;
      req.userIsOwner = userIsOwner;
      renderAccount(req, res);
    } catch (e) {
      logger.error(e);
    }
  },
];

export { folderVisualizer };
