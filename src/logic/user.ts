import { getDatabase } from 'coherent/database'
import type { User } from 'coherent/database'

export const getUser = async (id: string): Promise<User | null> => {
  const database = await getDatabase()
  return await database.users.findOne({ _id: id })
}
