import type { AuthenticatedSession } from '../session'
import type { Socket } from './'

type BroadcastArgs = Readonly<{
  userIds: readonly string[]
  type: string
  data: object
  excludedClientId: string
}>

class SocketManager {
  private readonly sockets: Map<string, Set<Socket>> = new Map()

  private clearSocket (socket: Socket): void {
    const { userId } = socket.session
    const userSockets = this.sockets.get(userId)
    if (userSockets === undefined) throw new Error('User has no sockets')

    userSockets.delete(socket)
    if (userSockets.size === 0) this.sockets.delete(userId)
  }

  public add (socket: Socket): void {
    socket.on('close', (): void => {
      this.clearSocket(socket)
    })

    const { userId } = socket.session
    const userSockets = this.sockets.get(userId)

    if (userSockets === undefined) {
      this.sockets.set(userId, new Set([socket]))
    } else {
      userSockets.add(socket)
    }
  }

  public broadcast ({ userIds, type, data, excludedClientId }: BroadcastArgs): void {
    for (const userId of userIds) {
      const userSockets = this.sockets.get(userId)
      if (userSockets === undefined) continue

      for (const socket of userSockets) {
        if (socket.clientId !== excludedClientId) socket.send({ type, data })
      }
    }
  }

  public invalidateSession (session: AuthenticatedSession): void {
    const userSockets = this.sockets.get(session.userId)
    if (userSockets === undefined) return

    for (const socket of userSockets) {
      if (socket.session.id === session.id) socket.invalidate()
    }
  }
}

export const socketManager = new SocketManager()
