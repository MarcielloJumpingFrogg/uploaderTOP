import type { Request, Response } from "express"
import logger from "../../config/logger"

export const travelFolderController = [
  async (req: Request, res: Response) => {
    const body = req.body
    logger.test("NEED TO REMOVE THE WAY IT WORKS, IT WOULD BE BETTER IF IT POINTED TO THE SESSION RATHER THAN THE ORIGINAL USER'S ID")
     if (body._ownerId != req.user.id) {

     }
  }
]
