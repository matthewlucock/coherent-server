import type { Request } from 'express'
import httpStatus from 'statuses'
import randomString from 'crypto-random-string'

import { OBJECT_ID_LENGTH } from './globals'
import type { User } from './database'

export const simpleRemoveFromArray = <T>(array: T[], item: T): void => {
  array.splice(array.indexOf(item), 1)
}

export const generateHttpStatusCodeHeader = (statusCode: number): string => (
  `HTTP/1.1 ${statusCode} ${httpStatus(statusCode)}\r\n\r\n`
)

export const objectId = (): string => randomString({ length: OBJECT_ID_LENGTH })

export const getClientId = (request: Request): string => (
  request.headers['x-coherent-client-id'] as string
)

export const makeClientObject = (object: any): object => {
  object = { ...object }

  if (object._id !== undefined) {
    const { _id, ...rest } = object
    object = { id: _id, ...rest }
  }

  for (const [key, value] of Object.entries(object)) {
    if (value instanceof Date) object[key] = value.getTime()
  }

  return object
}

export const makeClientUser = ({ _id, data }: User): object => makeClientObject({ _id, ...data })
