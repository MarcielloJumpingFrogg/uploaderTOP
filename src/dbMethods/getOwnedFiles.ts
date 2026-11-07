import { tryCatch } from "@/customErrors/tryCatch";
import { prisma } from "../../lib/prisma";
import type { Items } from "../../generated/prisma/client";
import logger from "../../config/logger";

export async function getOwnedFiles(
  userId: string,
  currentFolderId: string,
  userIsOwner: boolean,
): Promise<Items[] | [] | null> {
  let parentFolder: string | null = currentFolderId;
  if (currentFolderId == "Home") parentFolder = null;
  if (userIsOwner) {
    const { data: result, error: err } = await tryCatch(
      prisma.items.findMany({
        where: { ownerId: userId, parentFolderId: parentFolder },
      }),
    );
    if (err) {
      logger.test("err: ", err);
      throw new Error("Error while pulling the files of the user: ", err);
    }
    return result;
  } else {
    return [];
  }
}
