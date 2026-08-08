import type { Request, Response }  from "express"
import multer from "multer"

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

const uploadImage = multer({dest: "uploads/", fileFilter: fileImageFilter})

const multerController = [ uploadImage.single("avatar"),  (req:Request, res:Response, _next:Function) => {
    console.log(req.file)
    res.redirect("/account")
  }
]


const handleMulterError = (err:Error, req:Request, res:Response, _next:Function) => {
	if(err instanceof multer.MulterError || err.name==="FieldTypeError") {
		return res.status(402).render("account", {errorName: err.name, errors: [err], user: req.user})
	}
}

export {multerController, handleMulterError}
