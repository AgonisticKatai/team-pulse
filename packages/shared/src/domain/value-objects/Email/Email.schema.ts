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
  .string()
  .trim()
  .toLowerCase()
  .min(1, { message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT })
  .max(255, { message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT })
  .pipe(z.email({ message: VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT }))
