import type { Collection } from 'mongodb'
import { MongoClient } from 'mongodb'
import once from 'onetime'

type MongoDocument = Readonly<{ _id: string }>
type MongoArray<T> = T | readonly T[] // Typed this way because of how the Mongo API is typed

export type UserData = Readonly<{
  displayUsername: string
}>
export type User = MongoDocument & Readonly<{
  username: string
  password: string
  data: UserData
}>
export type Chat = MongoDocument & Readonly<{
  participantIds: MongoArray<string>
}>
export type Message = MongoDocument & Readonly<{
  chatId: string
  userId: string
  time: Date
  content: string
}>

export type Database = Readonly<{
  users: Collection<User>
  chats: Collection<Chat>
  messages: Collection<Message>
}>

export const connectToDatabase = once<never[], Promise<MongoClient>>(async () => {
  return await MongoClient.connect(`mongodb://database:${process.env.DATABASE_PORT}/coherent`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
})

export const getDatabase = once<never[], Promise<Database>>(async () => {
  const client = await connectToDatabase()
  const database = client.db()

  return {
    users: database.collection<User>('users'),
    chats: database.collection<Chat>('chats'),
    messages: database.collection<Message>('messages')
  }
})
