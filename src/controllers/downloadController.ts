import type { Request, Response } from "express";
import { admin_supabase } from "../../config/supabase";
import fs from "fs";
import path from "node:path";
import logger from "../../config/logger";
import { prisma } from "../../lib/prisma";

export const downloadController = [
  async (req: Request, res: Response) => {
    try {
      let environment = "user";
      if (req.body._env === "test") {
        environment = "test";
      }

      const folderPath = req.body._location;
      const fullFilePath =
        req.user.id + "/" + folderPath + "/" + req.body._name;
      const { data, error } = await admin_supabase.storage
        .from("Files")
        .download(fullFilePath);

      if (error) {
        logger.error(error);
      }
      const blob = data;

      if (blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());
        const downloadFolder = path.join(
          __dirname,
          "../../temporaryDownloadFolder",
        );
        const fullFileName = downloadFolder + "/" + req.body._name;

        await fs.promises.writeFile(fullFileName, buffer);
        res.download(fullFileName);

        await new Promise((r) => setTimeout(r, 2000));

        fs.rmSync(fullFileName);
      }
    } catch (e) {
      logger.error(e);
    }
  },
];
