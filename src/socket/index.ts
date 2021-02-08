import { EventEmitter } from 'events'

import type WebSocket from 'ws'

import { makeClientObject } from '../util'
import type { AuthenticatedSession } from '../session'

const SOCKET_TIMEOUT_DURATION = 30 * 1000
const PING = 'ping'
const PONG = 'pong'

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

  private rawSend (data: any): void {
    this.rawSocket.send(JSON.stringify(data))
  }

  public send (data: any): void {
    if (this.session.cookie.maxAge as number < 0) {
      this.invalidate()
      return
    }

    this.rawSend(makeClientObject(data))
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
    this.rawSend(PONG)
  }

  private readonly onMessage = (rawData: WebSocket.Data): void => {
    if (this.session.cookie.maxAge as number < 0) {
      this.invalidate()
      return
    }

    if (typeof rawData !== 'string') return

    const data = JSON.parse(rawData)
    if (data === PING) this.pong()
  }

  private readonly onClose = (): void => {
    clearTimeout(this.timeout)
    this.emit('close')
  }
}
