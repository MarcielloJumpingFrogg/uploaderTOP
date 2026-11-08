import { prisma } from "@prisma";
import { ProjectError } from "@/customErrors/ErrorBase";
import { tryCatch } from "@/customErrors/tryCatch";

export async function findCurrentSharedFiles(fileId: string, userId: string) {
  //{{{
  const { data: sharedFile, error: sharedError } = await tryCatch(
    prisma.sharedFiles.findUnique({
      where: {
        id: fileId,
        destinationUser: userId,
      },
    }),
  );
  if (sharedError)
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "Error during findCurrentSharedFiles",
      cause: sharedError,
    });

  if (!sharedFile) {
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "Empty_variable during findCurrentSharedFiles",
    });
  }

  return sharedFile;
  //}}}
}
