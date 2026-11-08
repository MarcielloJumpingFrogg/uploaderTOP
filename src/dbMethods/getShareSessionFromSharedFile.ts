import { prisma } from "@prisma";
import type { SharedFiles } from "../../generated/prisma/client";
import { tryCatch } from "@/customErrors/tryCatch";
import { ProjectError } from "@/customErrors/ErrorBase";

export async function getShareSessionFromSharedFile(sharedFile: SharedFiles) {
  //{{{
  const { data: sessionData, error: sessionError } = await tryCatch(
    prisma.shareSession.findUnique({
      where: {
        id: sharedFile.sessionId,
      },
    }),
  );

  if (sessionError) {
    throw new ProjectError({
      name: "SERVER_ERROR",
      message: "Error getting session during getShareSessionFromSharedFile",
      cause: sessionError,
    });
  }
  if (!sessionData)
    throw new ProjectError({
      name: "VARIABLE_IS_EMPTY",
      message: "sessionData is empty during getShareSessionFromSharedFile",
    });

  return sessionData;
  //}}}
}
