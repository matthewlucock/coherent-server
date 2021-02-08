import { createServer } from 'http'

import express from 'express'
import type { ErrorRequestHandler } from 'express'
import cors from 'cors'
import httpErrors from 'http-errors'
import type { HttpError } from 'http-errors'

import { getClientId } from './util'

import { clientIdIsValid } from './validation'
import { sessionParser } from './session'
import { router } from './routes'

const app = express()

app.use(express.json())
app.use(cors({ origin: `http://localhost:${process.env.CLIENT_PORT}`, credentials: true }))

app.disable('x-powered-by')
app.disable('etag')

app.use(async (request, response, next) => {
  const clientId = getClientId(request)
  if (!clientIdIsValid(clientId)) throw new httpErrors.BadRequest('Invalid client id')
  next()
})

app.use(sessionParser)
app.use(router)

const errorHandler: ErrorRequestHandler = (error: HttpError, request, response, next): void => {
  // TODO: Non-http errors? 404 errors etc?
  response.status(error.statusCode)
  response.send({ message: error.message })
}
app.use(errorHandler)

export const httpServer = createServer(app)
