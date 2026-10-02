// import { newFolder } from "../databaseMethods/newFolder";

const newFolderController = [
  async (req: any, res: any) => {
    console.log("TO IMPLEMENT");
    // await newFolder(req.body.folderName, req.user);
    res.redirect("/account");
  },
];

export { newFolderController };
