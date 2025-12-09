import type { EntityId } from './EntityId.js'
import type { ID_BRANDS } from './EntityIds.constants.js'

export type UserId = EntityId<typeof ID_BRANDS.USER>
export type TeamId = EntityId<typeof ID_BRANDS.TEAM>
export type RefreshTokenId = EntityId<typeof ID_BRANDS.REFRESH_TOKEN>
