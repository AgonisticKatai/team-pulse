import { VALIDATION_MESSAGES } from '@team-pulse/shared/constants'
import { z } from 'zod'

/**
 * Zod schema for Email validation
 *
 * Rules:
 * - Must be a valid email format
 * - Maximum 255 characters
 * - Automatically normalized: trimmed and lowercased
 */

export const emailSchema = z
  .string({ message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT })
  .trim()
  .toLowerCase()
  .min(1, { message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.TOO_SHORT })
  .max(255, { message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.TOO_LONG })
  .pipe(z.email({ message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT }))
