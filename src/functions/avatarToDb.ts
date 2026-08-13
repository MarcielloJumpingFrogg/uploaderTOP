import {prisma} from "../../lib/prisma"
import fs from "fs"
import path from "node:path"

async function toDb(file:any, user:any, newName: string) {
  const result = await prisma.files.create({
    data: {
      usrFileName: newName,
      fileName: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      ownerId: user.id
    }
  })
  console.log(result)

}

async function avatarToDb(file: any , user: any) {
  let newName = user.username + "@"
  try {
      newName += "avatar"
    const exists = await prisma.files.findUnique({where: {
      usrFileName: newName
    }})
    if(!exists) {
      toDb(file, user, newName)
  } else {
      await prisma.files.delete({where: {
        usrFileName: newName
      }})
      const dir = path.join(__dirname, "../../uploads/")
      fs.rmSync(path.join(dir , exists.fileName))
      toDb(file, user, newName)
    }
  } catch(e) {
    console.error(e)
  }
}

export {avatarToDb}
