export interface NinjaValidationError {
  detail: Array<{
    loc: string[]
    msg: string
    type: string
  }>
}

export interface NinjaError {
  detail: string | NinjaValidationError['detail']
}

export const isNinjaValidationError = (error: unknown): error is NinjaValidationError =>
  Array.isArray((error as NinjaValidationError)?.detail)
