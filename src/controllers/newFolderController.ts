import { createFolder } from "../supabaseFn/createFolder";
import logger from "../../config/logger";

const newFolderController = [
  async (req: any, res: any) => {
    try {
      const currentFolder = req.body._currentFolderId;
      if (!currentFolder)
        throw new Error("currentFolder does not exist in newFolderController");

      const newFolderName = req.body.folderName;
      if (!newFolderName)
        throw new Error("newFolderName does not exist in newFolderController");

      const owner = req.body._isOwner;
      if (!owner)
        throw new Error("owner does not exist in newFolderController");

      // const fullPath = req.user.id + "/" + location + "/" + req.body.folderName;
      await createFolder(
        owner,
        req.user.id,
        currentFolder,
        newFolderName,
        "Files",
      );
      res.redirect("/account");
    } catch (e) {
      logger.error("e", e);
    }
  },
];

export { newFolderController };
