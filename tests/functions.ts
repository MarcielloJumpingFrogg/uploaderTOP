import { prisma } from "../lib/prisma";
import { recursiveDelete } from "../src/supabaseFn/recursiveDelete";

async function resetDb() {
  await prisma.$transaction([
    prisma.sharedFiles.deleteMany(),
    prisma.shareSession.deleteMany(),
    prisma.files.deleteMany(),
    prisma.users.deleteMany(),
    prisma.session.deleteMany(),
  ]);
}

async function resetBuckets() {
  const _resultAvatar = await recursiveDelete("avatars", "avatar");
  const _resultFiles = await recursiveDelete("/", "Files");
}

export { resetDb, resetBuckets };
