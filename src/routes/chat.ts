import { Router } from 'express'

import { getClientId, makeClientObject } from '../util'
import { validateSession } from '../session'
import { validateObjectId } from '../validation'
import { createChat } from '../logic/chat'
import { getMessages, submitMessage } from '../logic/message'

export const chatRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
chatRouter.post('/create', async (request, response): Promise<void> => {
  if (!validateSession(request.session)) return
  const { partnerId } = request.body
  validateObjectId(partnerId, 'partner')

  const { userId } = request.session
  const chat = await createChat({ userId, partnerId, clientId: getClientId(request) })

  response.send(makeClientObject(chat))
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
chatRouter.get('/:chatId', async (request, response): Promise<void> => {
  if (!validateSession(request.session)) return
  const { chatId } = request.params
  validateObjectId(chatId, 'chat')

  const { userId } = request.session
  const messages = await getMessages({ chatId, userId })

  response.send(messages.map(makeClientObject))
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
chatRouter.post('/:chatId', async (request, response): Promise<void> => {
  if (!validateSession(request.session)) return
  const { chatId } = request.params
  validateObjectId(chatId, 'chat')

  const { userId } = request.session
  const { content } = request.body
  const message = await submitMessage({ chatId, userId, clientId: getClientId(request), content })

  response.send(makeClientObject(message))
})
