import { renderAccount } from "./accountController";
import type { Request, Response } from "express";

const folderVisualizer = [
  async (req: Request, res: Response) => {
    renderAccount(req, res);
  },
];

export { folderVisualizer };
