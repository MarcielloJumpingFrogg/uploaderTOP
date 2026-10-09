import type { Request, Response } from "express";
export const shareCreatorController = [
  async (req: Request, res: Response) => {
    console.log(req.body);
    res.redirect("/account");
  },
];
