// import { readFile } from "../supabaseFn/readFile";
// import { admin_supabase } from "../../config/supabase";
import { prisma } from "../../lib/prisma";
import { readFolder } from "../supabaseFn/readFolder";
import { getFromPath } from "./getFromPath";

export async function getFiles(userId: string, currentFolder: string) {
  const name = userId + "/" + currentFolder;
  const result = await readFolder(name, "Files", "user");

  const fileSharedFromOthers = await prisma.files.findMany({
    where: {
      ownerId: {
        not: userId,
      },
      currentUser: userId,
    },
  });

  for (let i = 0; i < fileSharedFromOthers.length; i++) {
    const file = fileSharedFromOthers[i];
    const getFromPathResult = await getFromPath(file);
    for (let j = 0; j < getFromPathResult.length; j++) {
      result.push(getFromPathResult[j]);
    }
  }

  return result;
}

// getFiles("78e2b31d-4d72-4b19-95e7-428f3a903dc3", "Home");
