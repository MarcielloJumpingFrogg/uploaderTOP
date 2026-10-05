import { createFolder } from "../supabaseFn/createFolder";

const newFolderController = [
  async (req: any, res: any) => {
    const location = req.body._location.replaceAll(",", "/");
    const fullPath = req.user.id + "/" + location + "/" + req.body.folderName;
    await createFolder(fullPath, "Files");
    res.redirect("/account");
  },
];

export { newFolderController };
