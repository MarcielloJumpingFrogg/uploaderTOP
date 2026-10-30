import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

export async function uploadToDb(file: any, path: string, userId: string) {
  logger.toImplement("maybe it was usefull: 'uploadToDb'");
  const fileName = file.name;
  const result = prisma.files.create({
    data: {
      path: path,
      fileName: fileName,
      mimetype: file.mimetype,
      size: file.size,
      ownerId: userId,
      currentUser: userId,
    },
  });
  return result;
}
