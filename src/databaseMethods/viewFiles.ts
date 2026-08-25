import { prisma } from "../../lib/prisma";

async function viewFiles(userId: number) {
  try {
    const files = await prisma.files.findMany({ where: { ownerId: userId } });
    return files;
  } catch (e) {
    console.error("error:", e);
    return [];
  }
}

async function getAvatar(userId: number) {
  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    const avatar = await prisma.files.findFirst({
      where: {
        ownerId: userId,
        usrFileName: user?.username + "@avatar",
      },
    });
    return avatar?.fileName;
  } catch (e) {
    console.error("error: ", e);
    return null;
  }
}

export { viewFiles, getAvatar };
