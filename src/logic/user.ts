import { getDatabase } from '../database'
import type { User } from '../database'

export const getUser = async (id: string): Promise<User | null> => {
  const database = await getDatabase()
  return await database.users.findOne({ _id: id })
}
