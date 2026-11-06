import customErrorContainer from "@/customErrors/customErrorContainer";
import type { Request, Response } from "express";
import { tryCatch } from "@/customErrors/tryCatch";
import { getFromCurrentFolderId } from "./getFromCurrentFolderId";
import logger from "../../config/logger";

export async function getUserAndOriginalFolderId(
  req: Request,
  res: Response,
  currentFolder: string | undefined,
): Promise<{
  userIsOwner: boolean | null;
  userId: string | null;
  originalFolderId: string | null;
  error: Error | string | null;
}> {
  let userIsOwner: boolean = true;
  let user: string = "";
  if (!req.user || !req.user.id) {
    customErrorContainer.userError(res);
    return {
      userIsOwner: null,
      userId: null,
      originalFolderId: null,
      error: "No user",
    };
  }
  if (req.userIsOwner == undefined || req.userIsOwner == true) {
    user = req.user.id;
    userIsOwner = true;
  } else {
    userIsOwner = false;
    const { data, error } = await tryCatch(
      getFromCurrentFolderId(currentFolder, userIsOwner, req.user.id),
    );
    if (error || !data) {
      logger.error("missing data:");
      return {
        userIsOwner: null,
        userId: null,
        originalFolderId: null,
        error: error || "Missing Data",
      };
    }
    return {
      userIsOwner: userIsOwner,
      userId: data.ownerId,
      originalFolderId: data.id,
      error: null,
    };
  }
  return {
    userIsOwner: userIsOwner,
    userId: user,
    originalFolderId: currentFolder || "Home",
    error: null,
  };
}
