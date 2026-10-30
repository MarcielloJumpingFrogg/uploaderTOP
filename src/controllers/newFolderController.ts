import { createFolder } from "../supabaseFn/createFolder";
import logger from "../../config/logger";

const newFolderController = [
  async (req: any, res: any) => {
    const parentFolder = req.body._parentFolder;
    const newFolderName = req.body.newFolderName;
    const owner = req.body._owner;
    logger.test("parentFolder", parentFolder);
    // const fullPath = req.user.id + "/" + location + "/" + req.body.folderName;
    await createFolder(owner, parentFolder, newFolderName, "Files");
    res.redirect("/account");
  },
];

export { newFolderController };
