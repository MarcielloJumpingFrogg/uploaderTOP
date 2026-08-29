import { prisma } from "../../lib/prisma";
import fs from "fs";
import path from "node:path";
import { getDestination } from "../multer/multer";

async function toDb(file: any, user: any, newName: string) {
  const nameToPush = user.username + "@Home/" + newName;
  try {
    const result = await prisma.files.create({
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

async function avatarToDb(file: any, user: any) {
  let newName = user.username + "@Home/";
  const destination = "avatar";
  try {
    const exists = await prisma.files.findUnique({
      where: {
        usrFileName: newName + destination,
      },
    });
    if (!exists) {
      toDb(file, user, destination);
    } else {
      await prisma.files.delete({
        where: {
          usrFileName: newName + destination,
        },
      });
      toDb(file, user, destination);
    }
  } catch (e) {
    console.error(e);
  }
}

export { avatarToDb, toDb };
