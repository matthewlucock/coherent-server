import httpError from 'http-errors'
import * as bcrypt from 'bcrypt'

import { objectId } from '../util'
import { getDatabase } from '../database'
import type { User } from '../database'
import { validateUsername, validatePassword } from '../validation'

const INCORRECT_CREDENTIALS_ERROR_MESSAGE = 'Incorrect username or password'

type Auth = Readonly<{
  username: string
  password: string
}>

export const signup = async ({ username, password }: Auth): Promise<User> => {
  validateUsername(username)
  validatePassword(password)
  const normalizedUsername = username.toLowerCase()

  const database = await getDatabase()
  const existingUser = await database.users.findOne({ username: normalizedUsername })
  if (existingUser !== null) throw new httpError.Conflict('User already exists')

  const user: User = {
    _id: objectId(),
    username: normalizedUsername,
    password: await bcrypt.hash(password, 10),
    data: { displayUsername: username }
  }

  await database.users.insertOne(user)
  return user
}

export const login = async ({ username, password }: Auth): Promise<User> => {
  validateUsername(username)
  validatePassword(password)
  username = username.toLowerCase()

  const database = await getDatabase()
  const user = await database.users.findOne({ username })
  if (user === null) throw new httpError.Forbidden(INCORRECT_CREDENTIALS_ERROR_MESSAGE)

  if (await bcrypt.compare(password, user.password)) return user

  throw new httpError.Forbidden(INCORRECT_CREDENTIALS_ERROR_MESSAGE)
}
