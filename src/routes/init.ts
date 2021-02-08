import { Router } from 'express'

import { makeClientObject, makeClientUser } from '../util'
import type { User } from '../database'
import { validateSession } from '../session'
import { getUser } from '../logic/user'
import { getChatsForUser } from '../logic/chat'
import { getLatestMessage } from '../logic/message'

export const initRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
initRouter.get('/', async (request, response): Promise<void> => {
  if (!validateSession(request.session)) return
  const { userId } = request.session

  const chats = await getChatsForUser(userId)
  const participantIds = new Set(chats.map(chat => chat.participantIds).flat())
  participantIds.delete(userId)

  const [messages, users] = await Promise.all([
    Promise.all(chats.map(getLatestMessage)),
    Promise.all(Array.from(participantIds).map(getUser)) as Promise<User[]>
  ])

  response.send({
    chats: chats.map(makeClientObject),
    messages: messages.filter(message => message !== null).map(makeClientObject),
    users: users.map(makeClientUser)
  })
})
