import {prisma} from "../../lib/prisma"

async function viewFiles(userId:number) {
  try{
  const files = await prisma.files.findMany({where: {ownerId: userId}}) 
  return files
  } catch(e) {
    console.error("error:" ,e)
    return []
  }
}


export {viewFiles} 
