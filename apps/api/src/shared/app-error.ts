export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId: string;
  };
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: ApiErrorDetail[];

  constructor(
    code: string,
    message: string,
    statusCode = 400,
    details?: ApiErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
