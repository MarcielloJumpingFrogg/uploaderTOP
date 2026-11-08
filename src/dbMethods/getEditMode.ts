import { findCurrentSharedFiles } from "./findCurrentSharedFiles";
import { getShareSessionFromSharedFile } from "./getShareSessionFromSharedFile";
import type { SharedFiles, ShareSession } from "../../generated/prisma/client";

function shareSessionTarget(
  //{{{
  shareSession: ShareSession,
  sharedFile: SharedFiles,
) {
  let isMainFile: boolean = false;
  if (shareSession.originalFile == sharedFile.originalFile) {
    isMainFile = true;
  } else {
    isMainFile = false;
  }

  return isMainFile;
  //}}}
}
function sharedUserPermission(sharedSession: ShareSession) {
  //{{{
  let canEdit: boolean = false;

  if (sharedSession.edit == true) {
    canEdit = true;
  } else {
    canEdit = false;
  }

  return canEdit;
  //}}}
}

export async function getEditMode(
  isOwner: "true" | "false",
  userId: string,
  fileId: string,
) {
  let editMode: "Owner" | "GuestWithPermission" | "Guest" | "session" | null =
    null;

  if (isOwner == "true") return "Owner";
  const sharedFile = await findCurrentSharedFiles(fileId, userId);
  const shareSession = await getShareSessionFromSharedFile(sharedFile);

  const isMainFile: boolean = shareSessionTarget(shareSession, sharedFile);
  const canEdit = sharedUserPermission(shareSession);
  if (isMainFile == false) {
    if (canEdit) {
      editMode = "GuestWithPermission";
    } else {
      editMode = "Guest";
    }
  } else {
    editMode = "session";
  }

  return editMode;
}
