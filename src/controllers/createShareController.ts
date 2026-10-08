import type { Request, Response } from "express";

export const createShareController = [
  async (req: Request, res: Response) => {
    console.log(req.user);
    console.log(req.body);
  },
];
