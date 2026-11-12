type ErrorName =
  | 'VARIABLE_IS_EMPTY'
  | 'MISSING_USER'
  | 'SERVER_ERROR'
  | 'VARIABLE_IS_NOT_VALID_TYPE';

export class ErrorBase<T extends string> extends Error {
  override name: T;
  override message: string;
  override cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: T;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export class ProjectError extends ErrorBase<ErrorName> {}
