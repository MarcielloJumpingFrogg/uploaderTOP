import type { Request, Response } from "express";
import { getFullPath } from "../functions/getFullPath";
import { admin_supabase } from "../../config/supabase";
import { createReadStream, createWriteStream } from "node:fs";
import fs from "fs";
import path from "node:path";

export const downloadController = [
  async (req: Request, res: Response) => {
    try {
      const folderPath = req.body._location.replaceAll(",", "/");
      const fullFilePath =
        req.user.id + "/" + folderPath + "/" + req.body._name;
      const { data, error } = await admin_supabase.storage
        .from("Files")
        .download(fullFilePath);

      if (error) {
        console.error(error);
      }
      const blob = data;
      if (blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());
        const downloadFolder = path.join(__dirname, "../..", "/downloads");
        const fullFileName = downloadFolder + "/" + req.body._name;

        await fs.promises.writeFile(fullFileName, buffer);
        res.download(fullFileName);

        await new Promise((r) => setTimeout(r, 2000));

        fs.unlinkSync(fullFileName);
      }

      // fs.createReadStream(downloadFolder + "/" + req.body._name).pipe(res);
    } catch (e) {
      console.error(e);
    }
  },
];
