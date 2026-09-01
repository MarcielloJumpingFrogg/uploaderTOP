import { prisma } from "../../lib/prisma";

async function viewFiles(userId: number) {
  try {
    const avatarName = userId + "@System/avatar";
    const files = await prisma.files.findMany({
      where: { ownerId: userId, usrFileName: { not: avatarName } },
    });
    return files;
  } catch (e) {
    console.error("error:", e);
    return [];
  }
}

async function getAvatar(userId: number) {
  try {
    const avatar = await prisma.files.findFirst({
      where: {
        ownerId: userId,
        usrFileName: userId + "@System/avatar",
      },
    });
    return avatar?.fileName;
  } catch (e) {
    console.error("error: ", e);
    return null;
  }
}

export { viewFiles, getAvatar };
