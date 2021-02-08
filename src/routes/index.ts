import { Router } from 'express'

import { authRouter } from './auth'
import { userRouter } from './user'
import { selfRouter } from './self'
import { chatRouter } from './chat'
import { initRouter } from './init'

export const router = Router()

router.use('/auth', authRouter)
router.use('/user', userRouter)
router.use('/self', selfRouter)
router.use('/chat', chatRouter)
router.use('/init', initRouter)

/**
 * Manually disabling @typescript-eslint/no-misused-promises when creating routes will be necessary
 * until types become available for express@5.
 */
