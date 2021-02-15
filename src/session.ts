import type { Response } from 'express'
import createSessionParser from 'express-session'
import httpError from 'http-errors'

import { socketManager } from './socket/manager'

type Session = Express.Request['session']
export type AuthenticatedSession = Session & { userId: string }

export const SESSION_NAME = 'session'
const SESSION_LIFE = 1000 * 60 * 60 * 5

export const sessionParser = createSessionParser({
  name: SESSION_NAME,
  secret: 'secret',
  cookie: { maxAge: SESSION_LIFE },
  saveUninitialized: false,
  rolling: true
})

export const sessionIsAuthenticated = (session?: Session): session is AuthenticatedSession => (
  (session as AuthenticatedSession)?.userId !== undefined
)

export const validateSession = (session?: Session): session is AuthenticatedSession => {
  if (!sessionIsAuthenticated(session)) throw new httpError.Unauthorized()
  return true
}

export const destroySession = async (
  session: AuthenticatedSession,
  response: Response
): Promise<void> => {
  return await new Promise((resolve, reject) => {
    session.destroy(error => {
      if (error !== undefined) {
        reject(error)
        return
      }

      response.clearCookie(SESSION_NAME)
      socketManager.invalidateSession(session)
      resolve()
    })
  })
}

export const hasSessionExpired = (session: AuthenticatedSession): boolean => (
  session.cookie.maxAge as number < 0
)
