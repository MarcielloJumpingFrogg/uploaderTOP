import path from "node:path";
import { uploadFolder } from "../multer/multer";
import fs from "node:fs";

function moveFile(fileName: any, userId: number, destination: string) {
  const homeDir = path.join(__dirname, "../..");
  const oldPath = homeDir + "/" + uploadFolder + fileName;
  const filePath = homeDir + "/" + uploadFolder + "users/" + userId;
  const dirPath = filePath + "/" + destination;
  console.log("dirpath: ", dirPath);
  fs.mkdirSync(dirPath, { recursive: true });
  deletePreviousFile(dirPath);

  const newPath = dirPath + "/" + fileName;
  fs.renameSync(oldPath, newPath);
}

function deletePreviousFile(userDirPath: any) {
  const files = fs.readdirSync(userDirPath, { recursive: true });
  console.log("resulting files: ", files);
  files.forEach((file) => {
    fs.rmSync(userDirPath + "/" + file);
  });
}

export { moveFile, deletePreviousFile };
