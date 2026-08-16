import { prisma } from "../lib/prisma";
import fs from "node:fs";
import path from "node:path";

async function resetDb() {
  await prisma.$transaction([
    prisma.files.deleteMany(),
    prisma.users.deleteMany(),
    prisma.session.deleteMany(),
  ]);
}

async function resetUploads() {
  const dir = __dirname + "/testUploads/";
  fs.readdir(dir, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.rm(path.join(dir, file), { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
}

export { resetDb, resetUploads };
