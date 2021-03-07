import { Router } from 'express'
import httpError from 'http-errors'

import { getClientId } from '../util'
import { sessionIsAuthenticated, destroySession } from '../session'
import type { AuthenticatedSession } from '../session'
import { register, login } from '../logic/auth'

// temp
import { createChat } from '../logic/chat'
import { getDatabase } from '../database'

export const authRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/register', async (request, response) => {
  if (sessionIsAuthenticated(request.session)) {
    throw new httpError.Conflict('Already logged in')
  }

  const { username, password } = request.body
  const { userId } = await register({ username, password })

  ;(request.session as AuthenticatedSession).userId = userId

  // temp
  const database = await getDatabase()
  const otherUsers = await database.users.find({ _id: { $ne: userId } }).toArray()
  for (const otherUser of otherUsers) {
    await createChat({ userId, partnerId: otherUser._id, clientId: getClientId(request) })
  }

  response.end()
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/login', async (request, response) => {
  if (sessionIsAuthenticated(request.session)) {
    throw new httpError.Conflict('Already logged in')
  }

  const { username, password } = request.body
  const { userId } = await login({ username, password })

  ;(request.session as AuthenticatedSession).userId = userId
  response.end()
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/logout', async (request, response) => {
  if (sessionIsAuthenticated(request.session)) await destroySession(request.session, response)
  response.end()
})
