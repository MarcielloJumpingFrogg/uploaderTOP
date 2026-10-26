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

  renameError(errorCode: number, error: string) {
    this.resetError();
    this.errorCode = errorCode;
    this.errors.push({ message: error });
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
