import path from "node:path";
import { uploadFolder } from "../multer/multer";
import fs from "node:fs";

function getHomeDir() {
  return path.join(__dirname, "../..");
}

function moveFile(fileName: any, userId: number, destination: string) {
  const homeDir = getHomeDir();
  const oldPath = homeDir + "/" + uploadFolder + fileName;
  const filePath = homeDir + "/" + uploadFolder + "users/" + userId;
  const dirPath = filePath + "/" + destination;
  fs.mkdirSync(dirPath, { recursive: true });
  if (destination == "avatar") {
    deletePreviousFile(dirPath);
  }
  const newPath = dirPath + "/" + fileName;
  fs.renameSync(oldPath, newPath);
}

function deletePreviousFile(userDirPath: any) {
  const files = fs.readdirSync(userDirPath, { recursive: true });
  files.forEach((file) => {
    fs.rmSync(userDirPath + "/" + file);
  });
}

function createFolder(name: string, user: any) {
  const userId = user.id;
  const homeDir = getHomeDir();
  const path = homeDir + "/" + uploadFolder + "users/" + userId + "/usrFiles";
  fs.mkdirSync(path + "/" + name, { recursive: true });
}

export { moveFile, deletePreviousFile, createFolder };
