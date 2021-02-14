import httpError from 'http-errors'

import { OBJECT_ID_LENGTH } from './globals'

const OBJECT_ID_PATTERN = new RegExp(`^[a-z0-9]{${OBJECT_ID_LENGTH}}$`)
export const validateObjectId = (id: any, name: string): void => {
  if (typeof id !== 'string' || !OBJECT_ID_PATTERN.test(id)) {
    throw new httpError.BadRequest(`Invalid ${name} id`)
  }
}

export const clientIdIsValid = (clientId: any): clientId is string => (
  typeof clientId === 'string' && clientId.length >= 10 && clientId.length <= 30
)

type ParseAndValidateIntegerOptions = Readonly<{
  name: string
  validator: (x: number) => boolean
  defaultValue: number
}>
export const parseAndValidateInteger = (
  rawValue: unknown,
  { name, validator, defaultValue }: ParseAndValidateIntegerOptions
): number => {
  if (rawValue === undefined) return defaultValue

  const value = Number.parseInt(rawValue as string)
  if (Number.isNaN(value) || !validator(value)) throw new httpError.BadRequest(`Invalid ${name}`)
  return value
}

// TODO
export const validateUsername = (username: any): void => {
  if (typeof username !== 'string' || username.length === 0) {
    throw new httpError.BadRequest('Invalid username')
  }

  if (username.length > 20) throw new httpError.BadRequest('Username is too long')

  if (!/^(\w| )+$/.test(username)) {
    throw new httpError.BadRequest('Username contains invalid characters')
  }
}
export const validatePassword = validateUsername
