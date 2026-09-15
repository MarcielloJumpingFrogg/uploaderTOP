import { prisma } from "../../lib/prisma";
import { createFolder } from "../fs/fsUtility";
import { toDb } from "./toDb";

async function newFolder(name: string, user: any) {
  try {
    const folder = {
      filename: name,
      mimetype: "folder",
      size: 0,
      ownerId: user,
    };
    await toDb(folder, user, name);
    createFolder(folder.filename, user);
  } catch (e) {
    console.error(e);
  }
}

export { newFolder };
