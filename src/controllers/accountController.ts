import { viewFiles } from "../functions/viewFiles"
import type {Request, Response} from "express"


class Account {
  errorName:any;
  errors:Array<object>;
  files:object;
  errorCode:number;
  id:number;

  constructor() {
    this.errorName = null
    this.errors = []
    this.files = []
    this.errorCode=200;
    this.id = -1
  }
  setErrors(error:any, errorCode:number) {
    this.errorName = error.name
    this.errors = [ error ]
    this.errorCode = errorCode
  }
  getErrorName() {
   return  this.errorName  || null
  }
  getErrorList() {
   return this.errors || []
  }
  getErrorCode() {
    return this.errorCode || 200
  }


  async setFiles(id:number) {
    if(id < 0) {this.id = id}
   this.files = await viewFiles(id)
  }

  getFiles(id:number) {
      this.setFiles(id)
   return this.files

  }

  resetAccount() {
    this.errorName = null
    this.errors = []
    // this.setFiles(this.id)
  }
}

 const account = new Account 


const accountController = [
   async (req:any, res:Response) => {
    const file = await viewFiles(req.user.id)
    res.status(account.getErrorCode()).render("account", {user: req.user, files: file,  errorName: account.getErrorName() , errors:  account.getErrorList()})
  }
]

export {accountController, account}
