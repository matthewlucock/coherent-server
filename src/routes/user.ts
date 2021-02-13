import { Router } from 'express'
import httpError from 'http-errors'

import { makeClientUser } from 'coherent/util'
import { validateSession } from 'coherent/session'
import { validateObjectId } from 'coherent/validation'
import { getUser } from 'coherent/logic/user'

export const userRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
userRouter.get('/:userIds', async (request, response) => {
  if (!validateSession(request.session)) return
  const userIds = request.params.userIds.split(',')

  const users = await Promise.all(userIds.map(async userId => {
    validateObjectId(userId, 'user')

    const user = await getUser(userId)
    if (user === null) throw new httpError.UnprocessableEntity(`User ${userId} does not exist`)

    return user
  }))

  response.send(users.map(makeClientUser))
})
