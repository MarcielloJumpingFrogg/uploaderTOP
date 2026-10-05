import type { Request, Response } from "express";
import { moveFile } from "../supabaseFn/moveFile";
import { getAllFilesSubfolders } from "../supabaseFn/getAllFilesSubfolders";

const renameController = [
  async (req: Request, res: Response) => {
    const path = req.body._currentPath.replaceAll(",", "/");
    const oldFile = req.user.id + "/" + path + "/" + req.body._name;
    const newFile = req.user.id + "/" + path + "/" + req.body.newName;
    if (req.body._type !== "folder") {
      await moveFile(oldFile, newFile, "Files");
    } else {
      const precursorPath =
        req.user.id + "/" + req.body._currentPath.replaceAll(",", "/");
      const folderToChange = req.body._name;
      const result = await getAllFilesSubfolders(
        precursorPath + "/" + folderToChange,
        "Files",
        [],
      );
      const splitResults = [];
      for (let i = 0; i < result.length; i++) {
        splitResults.push(
          result[i].split(precursorPath + "/" + folderToChange + "/")[1],
        );
        const oldName = result[i];
        const newName =
          precursorPath + "/" + req.body.newName + "/" + splitResults[i];
        await moveFile(oldName, newName, "Files");
      }
    }
    res.redirect("/account");
  },
];

export { renameController };
