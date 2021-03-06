import type { Cursor, FilterQuery } from 'mongodb'
import httpError from 'http-errors'

import { objectId } from '../util'
import { getDatabase } from '../database'
import type { Database, Chat, Message } from '../database'
import { socketManager } from '../socket/manager'
import { getChat } from './chat'
import type { ChatArgs } from './chat'

const getMessagesCursor = (database: Database, query: FilterQuery<Message>): Cursor<Message> => (
  database.messages.find(query).sort({ time: -1 })
)

type GetMessagesArgs = ChatArgs & Readonly<{
  beforeTime: Date
  limit: number
}>
export const getMessages = async (
  { chatId, userId, beforeTime, limit }: GetMessagesArgs
): Promise<readonly Message[]> => {
  const database = await getDatabase()
  await getChat({ chatId, userId })

  const cursor = getMessagesCursor(database, { chatId, time: { $lt: beforeTime } }).limit(limit)
  return await cursor.toArray()
}

export const getLatestMessage = async (chat: Chat): Promise<Message | null> => {
  const database = await getDatabase()
  return await getMessagesCursor(database, { chatId: chat._id }).limit(1).next()
}

const validateMessageContent = (content: any): void => {
  if (typeof content !== 'string' || content.length === 0) {
    throw new httpError.BadRequest('Invalid message')
  }

  if (content.length > 1000) throw new httpError.BadRequest('Message is too long')
}
type SubmitMessageArgs = ChatArgs & Readonly<{
  clientId: string
  content: string
}>
export const submitMessage = async (
  { chatId, userId, clientId, content }: SubmitMessageArgs
): Promise<Message> => {
  validateMessageContent(content)

  const chat = await getChat({ chatId, userId })

  const message: Message = {
    _id: objectId(),
    chatId,
    userId,
    time: new Date(),
    content
  }

  const database = await getDatabase()
  await database.messages.insertOne(message)

  socketManager.broadcast({
    recipients: chat.participantIds as string[],
    type: 'message',
    data: message,
    excludedClientId: clientId
  })

  return message
}
