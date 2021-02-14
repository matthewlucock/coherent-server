import { typing } from '../logic/chat'

export type SocketMessage = Readonly<{
  type: string
  data?: any
}>

type HandleSocketMessageArgs = Readonly<{
  message: SocketMessage
  userId: string
}>
export const handleSocketMessage = ({ message, userId }: HandleSocketMessageArgs): void => {
  if (message.type === 'typing') {
    const chatId = message.data
    typing({ chatId, userId }).catch(console.error)
    return
  }

  console.warn(`Unrecognised socket message type: ${message.type}`)
}
