import { connectToDatabase } from './database'
import { httpServer } from './http-server'
import { handleHttpUpgrade } from './socket/server'

// temp
import { register } from './logic/auth'

const init = async (): Promise<void> => {
  await connectToDatabase()

  // temp
  await Promise.all([
    register({ username: 'testuser1', password: 'testuser1' }),
    register({ username: 'testuser2', password: 'testuser2' })
  ])

  httpServer.on('upgrade', handleHttpUpgrade)

  httpServer.listen(Number.parseInt(process.env.HTTP_PORT), () => {
    console.log(`Running at http://localhost:${process.env.HTTP_PORT}`)
  })
}

init().catch(error => {
  console.error(error)
  process.exit(1)
})
