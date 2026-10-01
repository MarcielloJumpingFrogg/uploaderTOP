import { prisma } from "../../lib/prisma";
// import fs from "fs";
// import path from "node:path";
// import { getDestination } from "../multer/multer";
import { createFolder } from "../fs/fsUtility";

async function toDb(file: any, user: any, newName: string, folder?: string) {
  const folderDestination = folder ? folder : "Home";
  const filePath = newName.split("/");
  if (filePath.length > 1) {
    for (let i = 0; i < filePath.length - 1; i++) {
      const folderPath = concatPath(folderDestination, filePath, i);
      console.log(folderPath);
      createFolder(folderPath, user);
    }
  }
  const nameToPush = user.id + "@" + folderDestination + "/" + newName;
  try {
    /* const result = */
    await prisma.files.create({
      data: {
        usrFileName: nameToPush,
        fileName: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        ownerId: user.id,
      },
    });
  } catch (e) {
    console.error(e);
  }
}

function concatPath(
  folderDestination: string,
  filePath: Array<string>,
  i: number,
) {
  let concat = folderDestination;
  for (let j = 0; j < i; j++) {
    concat += filePath[j] + "/";
  }
  return concat;
}

async function avatarToDb(file: any, user: any) {
  let newName = user.id + "@";
  const destination = "avatar";
  try {
    const exists = await prisma.files.findUnique({
      where: {
        usrFileName: newName + destination,
      },
    });
    if (exists) {
      await prisma.files.delete({
        where: {
          usrFileName: newName + destination,
        },
      });
    }
    toDb(file, user, destination, "System");
  } catch (e) {
    console.error(e);
  }
}

export { avatarToDb, toDb };
