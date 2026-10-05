import { renderAccount } from "./accountController";
import type { Request, Response } from "express";

const folderVisualizer = [
  async (req: Request, res: Response) => {
    const paramPath = req.params.path;
    const path = paramPath ? paramPath.split("@") : [];
    req.currentPath = path;
    renderAccount(req, res);
  },
];

export { folderVisualizer };
