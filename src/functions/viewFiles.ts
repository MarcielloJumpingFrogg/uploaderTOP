import {prisma} from "../../lib/prisma"

async function viewFiles(userId:number) {
  console.log("im here")
  try{
  const files = prisma.files.findMany({where: {ownerId: userId}}) 
  return files
  } catch(e) {
    console.error("error:" ,e)
    return []
  }
}


export {viewFiles} 
