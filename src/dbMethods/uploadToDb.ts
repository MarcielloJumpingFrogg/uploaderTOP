import { prisma } from "../../lib/prisma";

export async function uploadToDb(file: any, path: string, userId: string) {
  const fileName = file.name;
  const result = prisma.files.create({
    data: {
      path: path,
      fileName: fileName,
      mimetype: file.mimetype,
      size: file.size,
      ownerId: userId,
    },
  });
  return result;
}
