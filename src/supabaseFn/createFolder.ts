import { admin_supabase } from "../../config/supabase";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

export async function createFolder(
  owner: boolean,
  parentFolder: string,
  newFolderName: string,
  bucket: string,
) {
  // const split = name.split("/");
  // logger.test("split: ", split);
  //
  // let path = "";
  // for (let i = 0; i < split.length - 1; i++) {
  //   path += split[i] + "/";
  // }
  //
  // const isItAlreadyThere = await prisma.files.findFirst({
  //   where: { path: path, fileName: split[split.length - 1] },
  // });
  // logger.test("isItAlreadyThere", isItAlreadyThere);
  // if (isItAlreadyThere == undefined) {
  //   logger.test("split: ", split);
  //   await prisma.files.create({
  //     data: {
  //       fileName: split[split.length - 1] || "folder",
  //       type: "folder",
  //       path: path,
  //       ownerId: split[0],
  //     },
  //   });
  // }
  let parentFolderDb;
  let ownerId;
  let path = [];
  if (owner) {
    parentFolderDb = await prisma.files.findFirst({
      where: { id: parentFolder },
    });
    path.push(parentFolder);
    path.push(parentFolderDb?.parentFolder);
    ownerId = parentFolderDb?.ownerId;
    let newThing = parentFolderDb;
    while (newThing?.parentFolder !== "Home") {
      newThing = await prisma.files.findFirst({
        where: {
          id: parentFolderDb?.parentFolder,
        },
      });
      path.push(newThing?.parentFolder);
    }
  }
  logger.test("path: ", path);
  const _result = await admin_supabase.storage
    .from(bucket)
    .upload(name + "/.emptyFolderPlaceholder", "");
}
