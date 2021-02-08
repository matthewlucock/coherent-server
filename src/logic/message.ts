import type { Cursor } from 'mongodb'
import httpError from 'http-errors'

import { objectId } from '../util'
import { getDatabase } from '../database'
import type { Database, Chat, Message } from '../database'
import { getChat } from './chat'
import type { ChatArgs } from './chat'
import { socketManager } from '../socket/manager'

const getMessagesCursor = (database: Database, chatId: string): Cursor<Message> => (
  database.messages.find({ chatId }).sort({ time: -1 })
)

export const getMessages = async ({ chatId, userId }: ChatArgs): Promise<readonly Message[]> => {
  await getChat({ chatId, userId })

  const database = await getDatabase()
  return await getMessagesCursor(database, chatId).toArray()
}

export const getLatestMessage = async (chat: Chat): Promise<Message | null> => {
  const database = await getDatabase()
  return await getMessagesCursor(database, chat._id).limit(1).next()
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
    userIds: chat.participantIds as string[],
    type: 'message',
    data: message,
    excludedClientId: clientId
  })

  return message
}
