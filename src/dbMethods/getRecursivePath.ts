import type { Items } from "../../generated/prisma/client";
import { tryCatch } from "@/customErrors/tryCatch";
import { prisma } from "@prisma";
import { ProjectError } from "@/customErrors/ErrorBase";

export async function getRecursivePath(folderId: string, currentList: Items[]) {
  //{{{
  const { data: allSubFilesData, error: allSubFilesError } = await tryCatch(
    prisma.items.findMany({
      where: {
        parentFolderId: folderId,
      },
    }),
  );

  if (allSubFilesError)
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "Error in the 'allSubFilesError' from getRecursivePath",
      cause: allSubFilesError,
    });

  for (let i = 0; i < allSubFilesData?.length; i++) {
    const file = allSubFilesData[i];
    if (file?.type == "FOLDER") {
      const { data: recursiveResult, error: recursiveError } = await tryCatch(
        getRecursivePath(file.id, currentList),
      );
      if (recursiveError)
        throw new ProjectError({
          name: "SERVER_ERROR",
          message: "Recursive Error in getRecursivePath",
          cause: recursiveError,
        });
      currentList = currentList.concat(recursiveResult);
    }
  }

  currentList = currentList.concat(allSubFilesData);

  return currentList;
  //}}}
}
