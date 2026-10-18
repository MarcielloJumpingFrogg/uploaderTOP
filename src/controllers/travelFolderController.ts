import type { Response } from "express"
import { prisma } from "../../lib/prisma"
import logger from "../../config/logger"
import { readFolder } from "../supabaseFn/readFolder"
import { renderAccount } from "./accountController"

function getPath(body: any) {
  return body._location + "/" + body._name
}

export const travelFolderController = [
  async (req: any, res: Response) => {
    try {
      const body = req.body
      let pathToExtract = ""
      let folderOwner = ""
      if (body._sessionId === "0") {
        pathToExtract = getPath(body)
        folderOwner = req.user.id
      } else {
        const session = await prisma.shareSession.findUnique({ where: { id: body._sessionId } })
        if (!session) {
          throw new Error("no session")
        }
        pathToExtract = getPath(body)
        folderOwner = session.originalUser
      }
      // const travelFolderResult = await readFolder(pathToExtract, "Files", "user")

      req.folderOwner = folderOwner
      req.pathToExtract = pathToExtract
      renderAccount(req, res)
    } catch (e) {
      logger.error(e)
    }
  }
]
