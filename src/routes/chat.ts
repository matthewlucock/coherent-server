import { Router } from 'express'

import { getClientId, makeClientObject } from '../util'
import { validateSession } from '../session'
import { validateObjectId, parseAndValidateInteger } from '../validation'
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
  const { userId } = request.session

  const { chatId } = request.params
  validateObjectId(chatId, 'chat')

  const beforeTime = new Date(parseAndValidateInteger(request.query.beforeTime, {
    name: 'messages before time',
    validator: x => x > 0,
    defaultValue: Date.now()
  }))
  const limit = parseAndValidateInteger(request.query.quantity, {
    name: 'messages quantity',
    validator: x => x > 0,
    defaultValue: 0
  })

  const messages = await getMessages({ chatId, userId, beforeTime, limit })

  const filteredMessages = messages.map(message => {
    const { chatId, ...rest } = message
    return rest
  })
  response.send(filteredMessages.map(makeClientObject))
})

// eslint-disable-next-line @typescript-eslint/no-misused-promises
chatRouter.post('/:chatId', async (request, response): Promise<void> => {
  if (!validateSession(request.session)) return
  const { userId } = request.session

  const { chatId } = request.params
  validateObjectId(chatId, 'chat')

  const { content } = request.body
  const message = await submitMessage({ chatId, userId, clientId: getClientId(request), content })

  const filteredMessage = (() => {
    const { chatId, userId, ...rest } = message
    return rest
  })()
  response.send(makeClientObject(filteredMessage))
})
