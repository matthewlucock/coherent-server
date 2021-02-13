import { Router } from 'express'
import httpError from 'http-errors'

import { makeClientUser, getClientId } from 'coherent/util'
import { sessionIsAuthenticated, destroySession } from 'coherent/session'
import type { AuthenticatedSession } from 'coherent/session'
import { signup, login } from 'coherent/logic/auth'

// temp
import { createChat } from 'coherent/logic/chat'
import { getDatabase } from 'coherent/database'

export const authRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/signup', async (request, response) => {
  if (sessionIsAuthenticated(request.session)) {
    throw new httpError.Conflict('Already logged in')
  }

  const { username, password } = request.body
  const user = await signup({ username, password })

  ;(request.session as AuthenticatedSession).userId = user._id

  // temp
  const database = await getDatabase()
  const otherUsers = await database.users.find({ _id: { $ne: user._id } }).toArray()
  for (const otherUser of otherUsers) {
    await createChat({ userId: user._id, partnerId: otherUser._id, clientId: getClientId(request) })
  }

  response.send(makeClientUser(user))
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/login', async (request, response) => {
  if (sessionIsAuthenticated(request.session)) {
    throw new httpError.Conflict('Already logged in')
  }

  const { username, password } = request.body
  const user = await login({ username, password })

  ;(request.session as AuthenticatedSession).userId = user._id
  response.send(makeClientUser(user))
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
authRouter.post('/logout', async (request, response) => {
  if (sessionIsAuthenticated(request.session)) await destroySession(request.session, response)
  response.end()
})
