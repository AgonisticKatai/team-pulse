import { VALIDATION_MESSAGES } from '@team-pulse/shared/constants'
import { z } from 'zod'

export const entityIdSchema = z.uuid({ message: VALIDATION_MESSAGES.SPECIFIC.UUID.INVALID_FORMAT })
