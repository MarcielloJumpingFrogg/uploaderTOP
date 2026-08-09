import type { Request, Response }  from "express"
import multer from "multer"
import "dotenv/config"

class FieldTypeError extends Error{
	constructor(message:any) {
		super(message);
		this.name="FieldTypeError"
	}
}



const fileImageFilter= (_req:Request, file:Express.Multer.File , cb:any) => {
	//only images
	if(file.mimetype.startsWith("image/")) {
		cb(null, true);
	} else {
		cb(new FieldTypeError("Supposed to Be image"), false)
	}
}

function getDestination() {
  if(process.env.NODE_ENV == "test") {
    return ("./tests/testUploads/")
  } else if(process.env.NODE_ENV == "local") {
    return ("uploads/")
  }
}

const uploadImage = multer({dest: getDestination(), fileFilter: fileImageFilter, limits: {fileSize: 1024 * 1024 * 5}})

const multerController = [ uploadImage.single("avatar"),  (req:Request, res:Response, _next:Function) => {
    console.log(req.file)
    res.status(201).render("account", {user: req.user})
  }
]


const handleMulterError = (err:Error, req:Request, res:Response, _next:Function) => {
	if(err instanceof multer.MulterError || err.name==="FieldTypeError") {
		return res.status(400).render("account", {errorName: err.name, errors: [err], user: req.user})
	}
}

export {multerController, handleMulterError}
