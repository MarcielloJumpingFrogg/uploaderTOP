import { ProjectError } from "@/customErrors/ErrorBase";
import type { SharedFiles, ShareSession } from "../../generated/prisma/client";
import { tryCatch } from "@/customErrors/tryCatch";
import { prisma } from "@prisma";

export async function getOriginalFileFromSharedData(
  sharedFile: SharedFiles,
  shareSession: ShareSession,
) {
  //{{{
  const { data: ogFile, error: ogError } = await tryCatch(
    prisma.items.findUnique({
      where: {
        id: sharedFile?.originalFile,
        ownerId: shareSession?.originalUser,
      },
    }),
  );
  if (ogError)
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "Error during getOriginalFileFromSharedData",
      cause: ogError,
    });

  if (!ogFile)
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "OgFile is empty during getOriginalFileFromSharedData",
    });

  return ogFile;
  //}}}
}
