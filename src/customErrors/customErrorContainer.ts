import type { Response } from "express";
import logger from "../../config/logger";
class CustomErrorContainer {
  errorName: any;
  errors: Array<object>;
  errorCode: number;

  constructor() {
    this.errorName = null;
    this.errors = [];
    this.errorCode = 200;
  }

  passportError(e: any, errorCode: number) {
    this.resetError();
    this.errors.push(e);
    this.errorCode = errorCode;
  }

  multerError(error: any, errorCode: number) {
    this.resetError();
    this.errorName = error.name;
    this.errors = [error];
    this.errorCode = errorCode;
  }

  validatorError(errors: { msg: string }[]) {
    this.resetError();
    this.errorCode = 406;
    errors.forEach((err) => {
      this.errors.push({ message: err.msg });
    });
  }

  signUpError(error: string, errorCode: number) {
    this.resetError();
    this.errorCode = errorCode;
    this.errors.push({ message: error });
  }

  renameError(error: string, errorCode: number) {
    this.resetError();
    this.errorCode = errorCode;
    this.errors.push({ message: error });
  }

  fileError(error: string) {
    this.errorCode = 400;
    this.errors.push({ message: error });
  }

  userError(res: Response) {
    const error =
      "The user session appears to have encountered an error, please try again later";
    this.errorCode = 400;
    logger.error("No user");
    this.errors.push({ message: error });
    res.redirect("/");
  }

  databaseError(res: Response, link?: string) {
    const error = `There appears to be an error with the request, please try again later`;
    this.errorCode = 500;
    this.errors.push({ message: error });
    res.redirect(link || "/");
  }

  genericError() {
    const errorString = "There was an unexpected error, please try again later";
    ((this.errorCode = 400), this.errors.push({ message: errorString }));
  }

  resetError() {
    this.errorCode = 200;
    this.errors = [];
    this.errorName = null;
  }

  getErrorName() {
    return this.errorName || null;
  }
  getErrorList() {
    return this.errors || [];
  }
  getErrorCode() {
    return this.errorCode || 200;
  }
}

const customErrorContainer = new CustomErrorContainer();

export default customErrorContainer;
