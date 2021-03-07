import httpError from 'http-errors'

import { register } from './logic/auth'
import type { Auth } from './logic/auth'

const TEST_USERS: readonly Auth[] = [
  { username: 'testuser1', password: 'testuser1' },
  { username: 'testuser2', password: 'testuser2' }
]

const safeRegister = async (auth: Auth): Promise<void> => {
  try {
    await register(auth)
  } catch (error) {
    if (error instanceof httpError.Conflict) return
    throw error
  }
}

export const registerTestUsers = async (): Promise<void> => {
  await Promise.all(TEST_USERS.map(safeRegister))
}
