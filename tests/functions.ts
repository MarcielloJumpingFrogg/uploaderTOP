import { admin_supabase } from "../config/supabase";
import { prisma } from "../lib/prisma";
import { createBucket } from "../src/supabaseFn/createBucket";
import { recursiveDelete } from "../src/supabaseFn/recursiveDelete";
// import fs from "node:fs";
// import path from "node:path";

const mb = 1028 * 1028;

async function resetDb() {
  await prisma.$transaction([
    prisma.files.deleteMany(),
    prisma.users.deleteMany(),
    prisma.session.deleteMany(),
    prisma.shareSession.deleteMany(),
    prisma.sharedFiles.deleteMany(),
  ]);
}

async function resetUploads() {
  // const dir = __dirname + "/testUploads/";
  // fs.readdir(dir, (err, files) => {
  //   if (err) throw err;
  //   for (const file of files) {
  //     fs.rm(path.join(dir, file), { recursive: true }, (err) => {
  //       if (err) throw err;
  //     });
  //   }
  // });
  console.log("Removed ResetUploads");
}

async function deleteAndCreateBuckets() {
  const deleteAvatarResult =
    await admin_supabase.storage.deleteBucket("avatar");
  const deleteFilesResult = await admin_supabase.storage.deleteBucket("Files");

  const createAvatarResult = await createBucket(
    "avatar",
    ["image/*"],
    5 * mb,
    true,
  );
  const createFilesResult = await createBucket("Files", [], 5 * mb, false);
  console.log("deleteAvatarResult", deleteAvatarResult);
  console.log("deleteFilesResult", deleteFilesResult);
  console.log("createAvatarResult", createAvatarResult);
  console.log("createFilesResult", createFilesResult);
}

async function resetBuckets() {
  console.log("resetBuckets");
  const resultAvatar = await recursiveDelete("avatars", "avatar");
  const resultFiles = await recursiveDelete("/", "Files");
  console.log("resultAvatar", resultAvatar);
  console.log("resultFiles", resultFiles);
}

export { resetDb, resetUploads, deleteAndCreateBuckets, resetBuckets };
