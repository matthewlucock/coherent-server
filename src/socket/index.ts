import { EventEmitter } from 'events'

import type WebSocket from 'ws'

import { hasSessionExpired } from 'coherent/session'
import type { AuthenticatedSession } from 'coherent/session'
import { handleSocketMessage } from './message'
import type { SocketMessage } from './message'

const SOCKET_TIMEOUT_DURATION = 30 * 1000

type ConstructorArgs = Readonly<{
  rawSocket: Socket['rawSocket']
  session: Socket['session']
  clientId: Socket['clientId']
}>

export class Socket extends EventEmitter {
  private readonly rawSocket: WebSocket
  public readonly session: AuthenticatedSession
  public readonly clientId: string
  private timeout: NodeJS.Timeout

  public constructor ({ rawSocket, session, clientId }: ConstructorArgs) {
    super()

    this.rawSocket = rawSocket
    this.session = session
    this.clientId = clientId

    this.rawSocket.on('message', this.onMessage)
    this.rawSocket.on('close', this.onClose)

    this.timeout = this.startTimeout()
  }

  private rawSend (message: SocketMessage): void {
    this.rawSocket.send(JSON.stringify(message))
  }

  public send (type: string, data?: unknown): void {
    if (hasSessionExpired(this.session)) {
      this.invalidate()
      return
    }

    this.rawSend({ type, data })
  }

  public invalidate (): void {
    this.rawSend({ type: 'invalidate' })
    this.rawSocket.close()
  }

  private startTimeout (): NodeJS.Timeout {
    return setTimeout(() => this.rawSocket.close(), SOCKET_TIMEOUT_DURATION)
  }

  private refreshTimeout (): void {
    clearTimeout(this.timeout)
    this.timeout = this.startTimeout()
  }

  private pong (): void {
    this.refreshTimeout()
    this.send('pong')
  }

  private readonly onMessage = (rawMessage: WebSocket.Data): void => {
    if (hasSessionExpired(this.session)) {
      this.invalidate()
      return
    }

    if (typeof rawMessage !== 'string') {
      console.error('Binary socket message')
      return
    }

    const message: SocketMessage = JSON.parse(rawMessage)

    if (message.type === 'ping') {
      this.pong()
    } else {
      const { userId } = this.session
      handleSocketMessage({ message, userId })
    }
  }

  private readonly onClose = (): void => {
    clearTimeout(this.timeout)
    this.emit('close')
  }
}
