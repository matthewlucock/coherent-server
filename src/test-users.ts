import httpError from 'http-errors'

import { register } from './logic/auth'
import type { Auth } from './logic/auth'
import { updateDisplayName } from './logic/user'

const TEST_USERS: readonly Auth[] = [
  { username: 'testuser1', password: 'testuser1' },
  { username: 'testuser2', password: 'testuser2' }
]

const safeRegister = async (auth: Auth): Promise<ReturnType<typeof register> | null> => {
  try {
    return await register(auth)
  } catch (error) {
    if (error instanceof httpError.Conflict) return null
    throw error
  }
}

const registerTestUser = async (auth: Auth): Promise<void> => {
  const result = await safeRegister(auth)
  if (result === null) return

  await updateDisplayName({ userId: result.userId, displayName: auth.username })
}

export const registerTestUsers = async (): Promise<void> => {
  await Promise.all(TEST_USERS.map(registerTestUser))
}
