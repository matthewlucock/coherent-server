import { Router } from 'express'

import { makeClientObject, makeClientUser } from '../util'
import type { User } from '../database'
import { validateSession } from '../session'
import { getUser } from '../logic/user'
import { getChatsForUser } from '../logic/chat'
import { getLatestMessage } from '../logic/message'

export const initialDataRouter = Router()

// eslint-disable-next-line @typescript-eslint/no-misused-promises
initialDataRouter.get('/', async (request, response): Promise<void> => {
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
