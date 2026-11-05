import { tryCatch } from "@/customErrors/tryCatch";
import { prisma } from "../../lib/prisma";
import type { Files } from "../../generated/prisma/client";

export async function getOwnedFiles(
  userId: string,
  currentFolderId: string,
  userIsOwner: boolean,
): Promise<Files[] | [] | null> {
  if (userIsOwner) {
    const { data: result, error: err } = await tryCatch(
      prisma.items.findMany({
        where: { ownerId: userId, parentFolder: currentFolderId },
      }),
    );
    if (err) {
      throw new Error("Error while pulling the files of the user: ", err);
    }
    return result;
  } else {
    return [];
  }
}
