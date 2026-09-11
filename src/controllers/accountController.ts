import {
  filesInFolder,
  getAvatar,
  viewFiles,
} from "../databaseMethods/viewFiles";
import type { Response } from "express";
import customErrorContainer from "../customErrors/customErrorContainer";

async function getFileList(files: any) {
  const loadedFiles: {
    path: Array<string>;
    type: string;
    name: string;
  }[] = [];

  files.forEach(
    (element: { mimetype: string; usrFileName: string; fileId: number }) => {
      const filetype = getFileType(element);

      const file: any = element.usrFileName.split("@")[1]; //gets rid of the userid in the name of the file
      const folders = file.split("/"); //all the folders of the current file are set in an array
      const filePath = [];
      for (let i = 0; i < folders.length - 1; i++) {
        filePath.push(folders[i]);
      }
      const finalFile = {
        id: element.fileId,
        path: filePath,
        type: filetype,
        name: folders[folders.length - 1],
      };

      loadedFiles.push(finalFile);
    },
  );

  return loadedFiles;
}

function getFileType(element: any) {
  let filetype;
  const extensions = [
    "ae",
    "avi",
    "css",
    "csv",
    "excel",
    "file",
    "html",
    "illustrator",
    "jpeg",
    "mpeg",
    "ms-powerpoint",
    "other",
    "pdf",
    "photoshop",
    "png",
    "quicktime",
    "rar",
    "txt",
    "wave",
    "word",
    "x-eps",
    "zip",
  ];
  const mimetype = element.mimetype.split("/") || ["other/other"];
  let first: any = mimetype[0];
  let second: any = mimetype[1];
  if (first == "text") {
    filetype = "txt";
  }
  if (second == "octet-stream") {
    filetype = "other";
  }
  const splitElement = second.split(".");
  for (let i = 0; i < splitElement.length; i++) {
    if (extensions.includes(splitElement[i])) {
      filetype = splitElement[i];
    }
  }
  if (!filetype) {
    //catch situation
    filetype = "other";
  }
  return filetype;
}

async function renderAccount(req: any, res: Response) {
  let tempPath = ["Home"];
  if (req.currentPath !== undefined) {
    tempPath = req.currentPath;
  }
  const avatar = await getAvatar(req.user.id);
  const files = await filesInFolder(req.user.id, tempPath);
  const fileList: {
    id: number;
    path: Array<string>;
    type: string;
    name: string;
  }[] = await getFileList(files);

  res.status(customErrorContainer.getErrorCode()).render("account", {
    user: req.user,
    files: fileList,
    errorName: customErrorContainer.getErrorName(),
    errors: customErrorContainer.getErrorList(),
    avatar: avatar,
    path: tempPath,
  });
}

const accountController = [
  async (req: any, res: Response) => {
    // const file = await viewFiles(req.user.id)
    if (!req.user) {
      res.redirect("/");
    }
    await renderAccount(req, res);
  },
];

export { accountController, renderAccount };
