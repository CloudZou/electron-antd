export class EmailAccountInfoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailAccountInfoError'
  }
}
