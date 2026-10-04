import { prisma } from "../../lib/prisma";

export async function getAvatarVersion(userId: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });
  const avatarVersion = user?.avatarVersion || 0;
  return avatarVersion;
}
