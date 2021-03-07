import { connectToDatabase } from './database'
import { httpServer } from './http-server'
import { handleHttpUpgrade } from './socket/server'

import { registerTestUsers } from './test-users'

const init = async (): Promise<void> => {
  await connectToDatabase()
  await registerTestUsers()

  httpServer.on('upgrade', handleHttpUpgrade)

  httpServer.listen(Number.parseInt(process.env.HTTP_PORT), () => {
    console.log(`Running at http://localhost:${process.env.HTTP_PORT}`)
  })
}

init().catch(error => {
  console.error(error)
  process.exit(1)
})
