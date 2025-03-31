export class AaaException extends Error {
  constructor(
    public errorCode: string,
    public errorMessage: string,
  ) {
    super(`Error occurred:${errorCode}`);
    this.name = 'AaaException';
  }
}
