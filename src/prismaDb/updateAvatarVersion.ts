import { prisma } from "../../lib/prisma";
import { getAvatarVersion } from "./getAvatarVersion";

export async function updateAvatarVersion(userId: string) {
  const avatarVersion = await getAvatarVersion(userId);
  await prisma.users.update({
    where: { id: userId },
    data: { avatarVersion: avatarVersion + 1 },
  });
}
