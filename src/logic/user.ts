import { getDatabase } from '../database'
import type { User } from '../database'
import { validateDisplayName } from '../validation'

export const getUser = async (id: string): Promise<User | null> => {
  const database = await getDatabase()
  return await database.users.findOne({ _id: id })
}

type UpdateDisplayNameArgs = Readonly<{
  userId: string
  displayName: string
}>
export const updateDisplayName = async (
  { userId, displayName }: UpdateDisplayNameArgs
): Promise<void> => {
  validateDisplayName(displayName)

  const database = await getDatabase()
  await database.users.updateOne(
    { _id: userId },
    { $set: { 'data.displayName': displayName } }
  )
}
