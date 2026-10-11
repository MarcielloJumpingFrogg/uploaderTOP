import { readFile } from "../supabaseFn/readFile";
import { admin_supabase } from "../../config/supabase";
import { prisma } from "../../lib/prisma";
import { readFolder } from "../supabaseFn/readFolder";

export async function getFiles(userId: string, currentFolder: string) {
  const name = userId + "/" + currentFolder;
  console.log("name something: ", name);
  const result = await readFolder(name, "Files", "user");
  console.log("getFiles: ", result);

  const fileSharedFromOthers = await prisma.files.findMany({
    where: {
      ownerId: {
        not: userId,
      },
      currentUser: userId,
    },
  });

  fileSharedFromOthers.forEach(async (file) => {
    console.log(file.path);
    const fileResult = await readFolder(file.path, "Files", "user");
    console.log(fileResult);
    result.push(fileResult);
  });

  console.log("fileSharedFromOthers", fileSharedFromOthers);

  return result;
}

// getFiles("78e2b31d-4d72-4b19-95e7-428f3a903dc3", "Home");
