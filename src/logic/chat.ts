import httpError from 'http-errors'

import { simpleRemoveFromArray, objectId } from 'coherent/util'
import { getDatabase } from 'coherent/database'
import type { Chat } from 'coherent/database'
import { socketManager } from 'coherent/socket/manager'

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
  for (const chat of chats) simpleRemoveFromArray(chat.participantIds as string[], userId)

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
  const existingChat = await database.chats.findOne({ participantIds: { $all: participantIds } })
  if (existingChat !== null) throw new httpError.Forbidden('Chat already exists')

  const chat: Chat = {
    _id: objectId(),
    participantIds
  }

  await database.chats.insertOne(chat)

  socketManager.broadcast({
    recipients: participantIds,
    type: 'chat',
    data: chat,
    excludedClientId: clientId
  })

  return chat
}

export const typing = async ({ chatId, userId }: ChatArgs): Promise<void> => {
  const chat = await getChat({ chatId, userId })
  simpleRemoveFromArray(chat.participantIds as string[], userId)

  socketManager.broadcast({
    recipients: chat.participantIds as string[],
    type: 'typing',
    data: { chatId, userId }
  })
}
