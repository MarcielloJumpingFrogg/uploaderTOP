import {prisma} from "../../lib/prisma"

async function isPicOfUser(id:number, pictureName: string) {
  const result = await prisma.files.findUnique({where: {fileName: pictureName, ownerId: id}})
  console.log("isPickOfUser:", result)
  return result
}

export { isPicOfUser }
