import type { Socket as TcpSocket } from 'net'
import type { IncomingMessage } from 'http'

import { Server as SocketServer } from 'ws'
import type WebSocket from 'ws'

import { generateHttpStatusCodeHeader } from 'coherent/util'
import { clientIdIsValid } from 'coherent/validation'
import { sessionParser, sessionIsAuthenticated } from 'coherent/session'
import { Socket } from '.'
import { socketManager } from './manager'

export const socketServer = new SocketServer({ noServer: true })

export const handleHttpUpgrade = (
  request: IncomingMessage,
  tcpSocket: TcpSocket,
  head: Buffer
): void => {
  const url = new URL(request.url as string, `ws://${request.headers.host as string}`)
  const clientId = url.searchParams.get('clientId')

  if (!clientIdIsValid(clientId)) {
    tcpSocket.write(generateHttpStatusCodeHeader(400))
    tcpSocket.end()
    return
  }

  sessionParser(request as any, {} as any, (): void => {
    const { session } = request as IncomingMessage & { session: Express.Request['session'] }

    if (!sessionIsAuthenticated(session)) {
      tcpSocket.write(generateHttpStatusCodeHeader(401))
      tcpSocket.end()
      return
    }

    socketServer.handleUpgrade(request, tcpSocket, head, (webSocket: WebSocket): void => {
      const socket = new Socket({ rawSocket: webSocket, session, clientId })
      socketManager.add(socket)
      socketServer.emit('connection', webSocket, request)
    })
  })
}
