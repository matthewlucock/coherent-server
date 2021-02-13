import { Router } from 'express'
import httpError from 'http-errors'

import { makeClientUser } from 'coherent/util'
import { sessionIsAuthenticated, destroySession } from 'coherent/session'
import { getUser } from 'coherent/logic/user'

export const selfRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
selfRouter.get('/', async (request, response) => {
  if (!sessionIsAuthenticated(request.session)) {
    response.end()
    return
  }

  const self = await getUser(request.session.userId)

  if (self === null) {
    await destroySession(request.session, response)
    throw new httpError.Unauthorized()
  }

  response.send(makeClientUser(self))
})
