import {prisma} from "../../lib/prisma"


async function uploadToDb(file: any , body:any , user: any) {
  try {
    if(body.name) {
      file.originalname = body.name
  }

  const result = await prisma.files.create({
    data: {
      usrFileName: file.originalname,
      fileName: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      ownerId: user.id
    }
  })

  // console.log(result)
  } catch(e) {
    console.error(e)
  }
}

export {uploadToDb}
