import { admin_supabase } from "../../config/supabase";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";
import { getFromSharedFile } from "../dbMethods/getFromSharedFile";
import { tryCatch } from "../customErrors/tryCatch";

export async function createFolder(
  owner: boolean,
  requestUser: string,
  currentFolder: string,
  newFolderName: string,
  bucket: string,
) {
  try {
    let currentFolderId: string = "";
    let ownerId: string = "";
    let skipping = false;
    if (currentFolder == "Home") {
      if (requestUser == undefined) throw new Error("No request User");
      ownerId = requestUser;
      currentFolderId = "Home";
      skipping = true;
    }
    if (owner && !skipping) {
      const { data: folder, error: folderError } = await tryCatch(
        prisma.files.findFirst({
          where: { id: currentFolder },
        }),
      );
      if (folderError)
        throw new Error("folderError in createFolder: ", folderError);

      logger.test("folder: ", folder);
      if (folder === null || folder.id === undefined)
        throw new Error("folder is undefined or null");

      ownerId = folder?.ownerId;
      currentFolderId = folder?.id;
    } else if (!skipping) {
      const { data: result, error: getFromSharedFileError } = await tryCatch(
        getFromSharedFile(currentFolder),
      );
      if (getFromSharedFileError)
        throw new Error(
          "getFromSharedFileError in createFolder: ",
          getFromSharedFileError,
        );

      const { originalFolder, owner } = result;
      ownerId = owner;
      currentFolderId = originalFolder.id;
    }

    const { data: folderCreation, error: folderCreationError } = await tryCatch(
      prisma.files.create({
        data: {
          ownerId: ownerId,
          parentFolder: currentFolderId,
          fileName: newFolderName,
          type: "folder",
          size: "-",
        },
      }),
    );

    if (folderCreationError)
      throw new Error("folderCreation error in the db: ", folderCreationError);

    const name = `${ownerId}/Storage/${folderCreation.id}`; //ownerId + "//" + folderCreation.id;
    const _result = await admin_supabase.storage
      .from(bucket)
      .upload(name + "/.emptyFolderPlaceholder", ""); //last argument empty because the file is empty, just a placeHolder for the folder

    logger.test("result:", _result);
  } catch (e: any) {
    logger.error("Error in createFolder: ", e);
  }
}
