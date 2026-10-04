// import { newFolder } from "../databaseMethods/newFolder";

import { createFolder } from "../supabaseFn/createFolder";

const newFolderController = [
  async (req: any, res: any) => {
    console.log("TO IMPLEMENT");
    console.log("req.body", req.body);
    const location = req.body._location.replaceAll(",", "/");
    const fullPath = req.user.id + "/" + location + "/" + req.body.folderName;
    await createFolder(fullPath, "Files");
    // await newFolder(req.body.folderName, req.user);
    res.redirect("/account");
  },
];

export { newFolderController };
