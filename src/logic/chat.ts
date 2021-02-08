import httpError from 'http-errors'

import { objectId } from '../util'
import { getDatabase } from '../database'
import type { Chat } from '../database'
import { socketManager } from '../socket/manager'

export type ChatArgs = Readonly<{ chatId: string, userId: string }>

export const getChat = async ({ chatId, userId }: ChatArgs): Promise<Chat> => {
  const database = await getDatabase()

  const chat = await database.chats.findOne({ _id: chatId })
  if (chat === null) throw new httpError.UnprocessableEntity('Chat doesn\'t exist')

  const inTheChat = (chat.participantIds as string[]).includes(userId)
  if (!inTheChat) throw new httpError.Forbidden('Not in that chat')

  return chat
}

export const getChatsForUser = async (userId: string): Promise<readonly Chat[]> => {
  const database = await getDatabase()
  const chats = await database.chats.find({ participantIds: userId }).toArray()

  // Filter the user ID out of the chats
  for (const chat of chats) {
    ;(chat.participantIds as string[]).splice(chat.participantIds.indexOf(userId), 1)
  }

  return chats
}

type CreateChatArgs = Readonly<{
  userId: string
  partnerId: string
  clientId: string
}>
export const createChat = async (
  { userId, partnerId, clientId }: CreateChatArgs
): Promise<Chat> => {
  if (userId === partnerId) {
    throw new httpError.UnprocessableEntity('Cannot make chat with self')
  }

  const database = await getDatabase()

  const partner = await database.users.findOne({ _id: partnerId })
  if (partner === null) throw new httpError.UnprocessableEntity('Partner doesn\'t exist')

  const participantIds = [userId, partnerId]

  // This logic will have to change later for group chats
  const existingChat = await database.chats.findOne({ participantIds: { $in: participantIds } })
  console.log(JSON.stringify(existingChat))
  if (existingChat !== null) throw new httpError.Forbidden('Chat already exists')

  const chat: Chat = {
    _id: objectId(),
    participantIds
  }

  await database.chats.insertOne(chat)

  socketManager.broadcast({
    userIds: participantIds,
    type: 'chat',
    data: chat,
    excludedClientId: clientId
  })

  return chat
}
