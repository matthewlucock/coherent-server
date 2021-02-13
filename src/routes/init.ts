import { Router } from 'express'

import { makeClientObject, makeClientUser } from 'coherent/util'
import type { User } from 'coherent/database'
import { validateSession } from 'coherent/session'
import { getUser } from 'coherent/logic/user'
import { getChatsForUser } from 'coherent/logic/chat'
import { getLatestMessage } from 'coherent/logic/message'

export const initRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
initRouter.get('/', async (request, response): Promise<void> => {
  if (!validateSession(request.session)) return
  const { userId } = request.session

  const chats = await getChatsForUser(userId)
  const participantIds = chats.map(chat => chat.participantIds).flat()

  const [messages, users] = await Promise.all([
    Promise.all(chats.map(getLatestMessage)),
    Promise.all(participantIds.map(getUser)) as Promise<User[]>
  ])

  response.send({
    chats: chats.map(makeClientObject),
    messages: messages.filter(message => message !== null).map(makeClientObject),
    users: users.map(makeClientUser)
  })
})
