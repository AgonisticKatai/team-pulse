# Documento de Diseño: Manejo de Branded Types (IDs) en Team Pulse

**Fecha:** 2025-12-28
**Versión:** 1.0
**Autor:** Claude Code Analysis

## Tabla de Contenidos

1. [Análisis del Problema Actual](#1-análisis-del-problema-actual)
2. [Diseño de la Solución](#2-diseño-de-la-solución)
3. [Flujos Específicos](#3-flujos-específicos)
4. [Plan de Implementación](#4-plan-de-implementación)

---

## 1. Análisis del Problema Actual

### 1.1 ¿Dónde se usan los branded types actualmente?

#### Branded Types Definidos

**Ubicación:** `/packages/shared/src/domain/value-objects/`

```typescript
// TeamId
export type TeamId = EntityId<typeof TEAM_ID_BRAND>

export const TeamId = {
  create: (id: string): Result<TeamId, ValidationError> => {
    if (!IdUtils.isValid(id)) {
      return Err(ValidationError.create({
        message: TEAM_ID_VALIDATION_ERROR,
        metadata: { field: TEAM_ID_BRAND, value: id }
      }))
    }
    return Ok(id as TeamId)  // ⚠️ TYPE ASSERTION
  },
  random: (): TeamId => {
    return IdUtils.generate() as TeamId  // ⚠️ TYPE ASSERTION
  }
}

// UserId - Misma estructura
// RefreshTokenId - Misma estructura
```

**Definición Base:**
```typescript
// EntityId.ts
export type EntityId<Brand extends string> = string & {
  readonly [brand]: Brand
}
```

#### Usos Actuales por Capa

**Domain Layer (Models):**
```typescript
// Team.ts
export class Team {
  readonly id: TeamId        // ✅ BRANDED TYPE
  readonly name: TeamName    // ✅ Value Object
  // ...

  static create(input: TeamCreateInput): Result<Team, ValidationError> {
    const results = combine({
      id: TeamId.create(input.id),      // ✅ Validación
      name: TeamName.create(input.name)  // ✅ Validación
    })
  }

  toPrimitives(): TeamPrimitives {
    return {
      id: this.id,              // ✅ TeamId sale como branded type
      name: this.name.getValue() // ✅ TeamName se convierte a string
    }
  }
}
```

**Repository Interface:**
```typescript
// ITeamRepository.ts
export interface ITeamRepository {
  findById({ id }: { id: TeamId }): Promise<Result<Team | null, RepositoryError>>
  delete({ id }: { id: TeamId }): Promise<Result<void, RepositoryError>>
  // ✅ Acepta TeamId (branded type)
}
```

**Repository Implementation:**
```typescript
// KyselyTeamRepository.ts
async findById({ id }: { id: TeamId }): Promise<Result<Team | null, RepositoryError>> {
  const row = await this.db
    .selectFrom('teams')
    .selectAll()
    .where('id', '=', id)  // ✅ TeamId se usa directamente como string
    .executeTakeFirst()

  private mapToDomain({ team }: { team: TeamRow }): Result<Team, ValidationError> {
    return Team.create({
      id: team.id,        // ❌ PROBLEMA: DB string → Team.create espera string pero devuelve TeamId
      name: team.name,
    })
  }
}
```

**Use Cases:**
```typescript
// GetTeamUseCase.ts
async execute({ id }: { id: TeamId }): Promise<Result<TeamResponseDTO, NotFoundError | RepositoryError>> {
  const findTeamResult = await this.teamRepository.findById({ id })  // ✅ TeamId
  // ...
  return Ok(TeamMapper.toDTO(findTeamResult.value))
}
```

**HTTP Routes:**
```typescript
// teams.ts
fastify.get<{ Params: { id: string } }>(  // ⚠️ PROBLEMA: Tipado como string
  '/api/teams/:id',
  async (request, reply) => {
    const { id } = request.params  // ❌ id es string, NO TeamId

    const result = await getTeamUseCase.execute({ id })  // ❌ TYPE ERROR OCULTO
    // TypeScript permite esto porque TeamId es structurally compatible con string
  }
)
```

**DTOs (Response):**
```typescript
// TeamResponseDTO
export const TeamResponseSchema = EntityIdSchema.merge(TeamCore).merge(TimestampsSchema)
// EntityIdSchema = z.object({ id: z.uuid() })

export type TeamResponseDTO = z.infer<typeof TeamResponseSchema>
// { id: string, name: string, ... }  // ⚠️ id es string, NO TeamId

// TeamMapper
static toDTO(team: Team): TeamResponseDTO {
  return {
    id: team.id,  // ✅ TeamId → string (automático por structural typing)
    name: team.name.getValue(),
    // ...
  }
}
```

**JWT Payloads:**
```typescript
// TokenFactory.ts
export interface AccessTokenPayload {
  userId: UserId  // ✅ BRANDED TYPE
  email: string
  role: string
}

verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
  const rawPayload = decoded as Record<string, unknown>

  const userIdResult = UserId.create(rawPayload['userId'] as string)  // ⚠️ TYPE ASSERTION
  if (!userIdResult.ok) {
    throw new Error('Invalid userId in token payload')
  }

  const payload: AccessTokenPayload = {
    userId: userIdResult.value,  // ✅ Validado y convertido
    // ...
  }
}
```

### 1.2 ¿Qué problemas tenemos?

#### Problema 1: String → Branded Type sin validación en HTTP Layer

**Ubicación:** `/apps/api/src/infrastructure/http/routes/teams.ts`

```typescript
// PROBLEMA: id viene como string de HTTP, se pasa directamente al use case
fastify.get<{ Params: { id: string } }>(
  '/api/teams/:id',
  async (request, reply) => {
    const { id } = request.params  // string
    const result = await getTeamUseCase.execute({ id })  // Espera TeamId, recibe string
  }
)
```

**Por qué TypeScript no detecta el error:**
- `TeamId` es un branded type basado en `string`
- TypeScript usa structural typing, no nominal typing
- `string` es structurally compatible con `TeamId`
- El brand (`readonly [brand]: Brand`) es solo una marca en tiempo de compilación

**Consecuencias:**
- Un UUID inválido puede llegar al use case
- La validación ocurre tarde (en el repository o domain model)
- Errores menos específicos (500 en vez de 400)

#### Problema 2: Type Assertions (`as`) en branded type factories

**Ubicación:** `/packages/shared/src/domain/value-objects/*/id/*.ts`

```typescript
export const TeamId = {
  create: (id: string): Result<TeamId, ValidationError> => {
    if (!IdUtils.isValid(id)) {
      return Err(ValidationError.create({ ... }))
    }
    return Ok(id as TeamId)  // ⚠️ TYPE ASSERTION
  },
  random: (): TeamId => {
    return IdUtils.generate() as TeamId  // ⚠️ TYPE ASSERTION
  }
}
```

**Por qué son necesarios:**
- `id` es `string`, necesitamos convertirlo a `TeamId`
- No hay runtime conversion, solo type-level brand
- `as` es la única forma de aplicar el brand

**¿Es un problema?**
- ✅ **Aceptable en este contexto** porque:
  - Está encapsulado en la factory function
  - La validación ocurre ANTES del `as`
  - Es el único lugar donde se hace la conversión

#### Problema 3: Inconsistencia entre DTOs y Domain Models

**Problema:**
```typescript
// Domain Model
class Team {
  readonly id: TeamId  // Branded type
}

// Response DTO
type TeamResponseDTO = {
  id: string  // Plain string
}

// Mapper
TeamMapper.toDTO(team: Team): TeamResponseDTO {
  return { id: team.id }  // TeamId → string (automático)
}
```

**Consecuencias:**
- El DTO no refleja que el `id` es un UUID validado
- Los consumidores del API no tienen garantías de tipo
- La información de tipo se pierde en la frontera HTTP → Application

#### Problema 4: JWT Payload Hydration con Type Assertions

**Ubicación:** `/apps/api/src/application/factories/TokenFactory.ts`

```typescript
verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
  const decoded = jwt.verify(token, this.env.JWT_SECRET)
  const rawPayload = decoded as Record<string, unknown>  // ⚠️ TYPE ASSERTION

  const userIdResult = UserId.create(rawPayload['userId'] as string)  // ⚠️ TYPE ASSERTION
  if (!userIdResult.ok) {
    throw new Error('Invalid userId in token payload')
  }

  const payload: AccessTokenPayload = {
    userId: userIdResult.value,
    email: rawPayload['email'] as string,     // ⚠️ TYPE ASSERTION
    role: rawPayload['role'] as string,       // ⚠️ TYPE ASSERTION
    aud: rawPayload['aud'] as string,         // ⚠️ TYPE ASSERTION
    // ...
  }
}
```

**Problemas:**
- Múltiples `as` assertions sin validación
- Solo `userId` se valida, el resto son casts directos
- Si JWT está manipulado, los tipos pueden ser incorrectos

### 1.3 ¿Dónde estamos haciendo hacks o type assertions?

#### Locations de Type Assertions

**1. Branded Type Factories** ✅ ACEPTABLE
```typescript
// /packages/shared/src/domain/value-objects/*/id/*.ts
return Ok(id as TeamId)
return IdUtils.generate() as TeamId
```

**2. JWT Payload Parsing** ❌ PROBLEMA
```typescript
// /apps/api/src/application/factories/TokenFactory.ts:158-167
const rawPayload = decoded as Record<string, unknown>
const userIdResult = UserId.create(rawPayload['userId'] as string)
email: rawPayload['email'] as string,
role: rawPayload['role'] as string,
```

**3. Test Mocks** ✅ ACEPTABLE
```typescript
// Tests use `as unknown as Interface` for mocking
teamRepository = { findById: vi.fn() } as unknown as ITeamRepository
```

**4. Implicit Conversions** (no son `as` pero son coerciones)
```typescript
// HTTP Routes: string → TeamId (structural typing)
const { id } = request.params  // string
await getTeamUseCase.execute({ id })  // Espera TeamId
```

---

## 2. Diseño de la Solución

### 2.1 Principios de Diseño

#### Principio 1: Validación en los Bordes (Parse, Don't Validate)
- **HTTP Layer:** Validar y convertir string → branded type usando Zod
- **Repository Layer:** Validar al mapear DB → Domain usando factory methods
- **JWT Layer:** Validar al deserializar payload usando Zod schemas

#### Principio 2: Type-Safe en Todo el Flujo
- **No usar `as` fuera de las factory functions**
- **Usar Zod para validación y transformación**
- **Branded types solo dentro de domain/application layers**

#### Principio 3: DTOs con Tipos Primitivos
- **Response DTOs:** `id: string` (primitivo validado)
- **Domain Models:** `id: TeamId` (branded type)
- **Conversion:** Explicit (Mappers)

### 2.2 Arquitectura de Tipos por Capa

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP LAYER                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Request Params: { id: string }                      │     │
│  │ ↓ Zod Validation                                    │     │
│  │ Validated: { id: TeamId } ← z.string().uuid()      │     │
│  │   .transform(TeamId.create)                         │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamId
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Use Case: execute({ id: TeamId })                   │     │
│  │ ↓                                                   │     │
│  │ Repository: findById({ id: TeamId })                │     │
│  │ ↓                                                   │     │
│  │ Mapper: toDTO(team: Team) → TeamResponseDTO         │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ Team (Domain)
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Team { id: TeamId, name: TeamName }                 │     │
│  │ TeamId.create(string) → Result<TeamId, Error>       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamId
┌─────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE LAYER                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Repository: where('id', '=', id)                    │     │
│  │ DB Row: { id: string } (UUID columna)               │     │
│  │ ↓ Team.create({ id: row.id })                       │     │
│  │ Validates and brands: string → TeamId               │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Solución por Capa

#### HTTP Layer (Infrastructure)

**Objetivo:** Validar y convertir `string` → `TeamId` usando Zod

**Archivo:** `/packages/shared/src/dtos/entity-base.dto.ts`

```typescript
import { z } from 'zod'
import { TeamId, UserId } from '@value-objects'

// 1. Schema Zod para TeamId con validación y transformación
export const TeamIdSchema = z.string().uuid()
  .transform((val) => {
    const result = TeamId.create(val)
    if (!result.ok) {
      throw new Error(result.error.message)  // Zod catch this
    }
    return result.value
  })

// 2. Schema Zod para UserId
export const UserIdSchema = z.string().uuid()
  .transform((val) => {
    const result = UserId.create(val)
    if (!result.ok) {
      throw new Error(result.error.message)
    }
    return result.value
  })

// 3. Schema base para entidades (IDs como primitivos en DTOs)
export const EntityIdSchema = z.object({
  id: z.string().uuid()  // DTO usa string, no branded type
})

// 4. Schema para request params (IDs como branded types)
export const TeamParamsSchema = z.object({
  id: TeamIdSchema  // Valida y convierte a TeamId
})

export const UserParamsSchema = z.object({
  id: UserIdSchema
})
```

**Uso en Routes:**

```typescript
// /apps/api/src/infrastructure/http/routes/teams.ts
import { TeamIdSchema, TeamParamsSchema } from '@team-pulse/shared'

// SOLUCIÓN: Validar params con Zod antes de llamar al use case
fastify.get<{ Params: { id: string } }>(
  '/api/teams/:id',
  { preHandler: requireAuth({ tokenFactory }) },
  async (request, reply) => {
    try {
      // 1. Validar y convertir: string → TeamId
      const { id } = TeamParamsSchema.parse(request.params)
      // Ahora 'id' es TeamId, no string

      // 2. Pasar al use case (type-safe)
      const result = await getTeamUseCase.execute({ id })

      if (!result.ok) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error: result.error, logger, reply })
      }

      return reply.code(200).send({
        data: result.value,
        success: true
      })
    } catch (error) {
      // Zod validation error se captura aquí
      const logger = FastifyLogger.create({ logger: request.log })
      return handleError({ error, logger, reply })
    }
  }
)

// UPDATE: Similar approach
fastify.patch<{ Params: { id: string } }>(
  '/api/teams/:id',
  async (request, reply) => {
    try {
      const { id } = TeamParamsSchema.parse(request.params)  // TeamId
      const dto = UpdateTeamSchema.parse(request.body)

      const result = await updateTeamUseCase.execute({ id, dto })
      // ...
    } catch (error) {
      // ...
    }
  }
)

// DELETE: Similar approach
fastify.delete<{ Params: { id: string } }>(
  '/api/teams/:id',
  async (request, reply) => {
    try {
      const { id } = TeamParamsSchema.parse(request.params)  // TeamId
      await deleteTeamUseCase.execute({ id })
      return reply.code(204).send()
    } catch (error) {
      // ...
    }
  }
)
```

#### Application Layer

**Objetivo:** Trabajar con branded types, sin conversiones

**Use Cases (NO CAMBIOS NECESARIOS):**

```typescript
// GetTeamUseCase.ts
export class GetTeamUseCase {
  async execute({ id }: { id: TeamId }): Promise<Result<TeamResponseDTO, NotFoundError | RepositoryError>> {
    // ✅ Recibe TeamId validado desde HTTP layer
    const findTeamResult = await this.teamRepository.findById({ id })
    // ...
  }
}

// UpdateTeamUseCase.ts
export class UpdateTeamUseCase {
  async execute({ id, dto }: { id: TeamId, dto: UpdateTeamDTO }): Promise<Result<TeamResponseDTO, ...>> {
    // ✅ Recibe TeamId validado desde HTTP layer
    const findTeamResult = await this.teamRepository.findById({ id })
    // ...
  }
}
```

**Mappers (NO CAMBIOS NECESARIOS):**

```typescript
// TeamMapper.ts
export class TeamMapper {
  static toDTO(team: Team): TeamResponseDTO {
    return {
      id: team.id,  // TeamId → string (structural typing)
      name: team.name.getValue(),
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString()
    }
  }
}
```

#### Domain Layer

**Objetivo:** Branded types + validación

**NO CAMBIOS NECESARIOS - Ya está correcto:**

```typescript
// Team.ts
export class Team {
  readonly id: TeamId
  readonly name: TeamName

  static create(input: TeamCreateInput): Result<Team, ValidationError> {
    const results = combine({
      id: TeamId.create(input.id),      // Valida string → TeamId
      name: TeamName.create(input.name)
    })
    // ...
  }

  toPrimitives(): TeamPrimitives {
    return {
      id: this.id,              // TeamId (se puede usar como string)
      name: this.name.getValue()
    }
  }
}
```

#### Infrastructure Layer (Repository)

**Objetivo:** DB string → Domain TeamId

**NO CAMBIOS NECESARIOS - Ya está correcto:**

```typescript
// KyselyTeamRepository.ts
export class KyselyTeamRepository implements ITeamRepository {
  async findById({ id }: { id: TeamId }): Promise<Result<Team | null, RepositoryError>> {
    try {
      // ✅ TeamId se usa como string en Kysely (structural typing)
      const row = await this.db
        .selectFrom('teams')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      if (!row) return Ok(null)

      const domainResult = this.mapToDomain({ team: row })
      // ...
    } catch (error) {
      // ...
    }
  }

  private mapToDomain({ team }: { team: TeamRow }): Result<Team, ValidationError> {
    // ✅ Team.create valida string → TeamId
    return Team.create({
      id: team.id,    // string from DB
      name: team.name,
      createdAt: new Date(team.created_at),
      updatedAt: new Date(team.updated_at)
    })
  }
}
```

#### JWT Layer (Application)

**Objetivo:** Validar JWT payload con Zod

**Archivo:** `/apps/api/src/application/factories/TokenFactory.schemas.ts` (NUEVO)

```typescript
import { z } from 'zod'
import { UserIdSchema, RefreshTokenIdSchema } from '@team-pulse/shared'

// 1. Schema para Access Token Payload
export const AccessTokenPayloadSchema = z.object({
  userId: UserIdSchema,        // Valida y convierte a UserId
  email: z.string().email(),
  role: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
  aud: z.string().optional(),
  iss: z.string().optional()
})

// 2. Schema para Refresh Token Payload
export const RefreshTokenPayloadSchema = z.object({
  tokenId: RefreshTokenIdSchema,  // Valida y convierte a RefreshTokenId
  userId: UserIdSchema,
  iat: z.number().optional(),
  exp: z.number().optional(),
  aud: z.string().optional(),
  iss: z.string().optional()
})
```

**Modificar:** `/apps/api/src/application/factories/TokenFactory.ts`

```typescript
import { AccessTokenPayloadSchema, RefreshTokenPayloadSchema } from './TokenFactory.schemas.js'

export class TokenFactory {
  verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
    try {
      const decoded = jwt.verify(token, this.env.JWT_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api'
      })

      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload type (string)')
      }

      // ✅ SOLUCIÓN: Validar con Zod en vez de type assertions
      const parseResult = AccessTokenPayloadSchema.safeParse(decoded)

      if (!parseResult.success) {
        throw new Error(`Invalid token payload: ${parseResult.error.message}`)
      }

      // ✅ payload es AccessTokenPayload con UserId validado
      return Ok(parseResult.data)

    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  verifyRefreshToken({ token }: { token: string }): Result<RefreshTokenPayload, AuthenticationError> {
    try {
      const decoded = jwt.verify(token, this.env.JWT_REFRESH_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api'
      })

      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload type (string)')
      }

      // ✅ SOLUCIÓN: Validar con Zod
      const parseResult = RefreshTokenPayloadSchema.safeParse(decoded)

      if (!parseResult.success) {
        throw new Error(`Invalid token payload: ${parseResult.error.message}`)
      }

      return Ok(parseResult.data)

    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'refreshToken' }))
    }
  }
}
```

### 2.4 Nuevos Schemas Zod para Branded Types

**MEJORA: Factory Genérica para evitar duplicación**

**Archivo:** `/packages/shared/src/domain/utils/zod-id.factory.ts` (NUEVO)

```typescript
import { z } from 'zod'
import type { Result, ValidationError } from '../result/index.js'

/**
 * Generic factory type for domain ID factories
 * Matches the signature of TeamId.create, UserId.create, etc.
 */
type DomainIdFactory<T> = (id: string) => Result<T, ValidationError>

/**
 * Creates a Zod schema that validates UUIDs and transforms them to branded types
 *
 * @param factory - The domain factory function (e.g., TeamId.create)
 * @returns Zod schema that validates and transforms string -> Branded Type
 *
 * @example
 * ```typescript
 * export const TeamIdSchema = createIdSchema(TeamId.create)
 * export const UserIdSchema = createIdSchema(UserId.create)
 * ```
 */
export const createIdSchema = <T>(factory: DomainIdFactory<T>) => {
  return z.string().uuid({
    message: 'ID must be a valid UUID'
  }).transform((val, ctx) => {
    const result = factory(val)

    if (!result.ok) {
      // ✅ Use Zod's error system instead of throwing
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error.message,
      })
      return z.NEVER  // Type-safe way to indicate validation failure
    }

    return result.value  // Returns branded type (TeamId, UserId, etc.)
  })
}
```

**Archivo:** `/packages/shared/src/domain/value-objects/team/id/TeamId.schema.ts` (NUEVO)

```typescript
import { createIdSchema } from '@domain/utils/zod-id.factory.js'
import { TeamId } from './TeamId.js'

/**
 * Zod schema for TeamId
 * Validates UUID format and transforms to branded TeamId type
 *
 * Uses the generic createIdSchema factory to avoid code duplication
 */
export const TeamIdSchema = createIdSchema(TeamId.create)

export type TeamIdInput = z.input<typeof TeamIdSchema>   // string
export type TeamIdOutput = z.output<typeof TeamIdSchema> // TeamId
```

**Archivo:** `/packages/shared/src/domain/value-objects/user/id/UserId.schema.ts` (NUEVO)

```typescript
import { createIdSchema } from '@domain/utils/zod-id.factory.js'
import { UserId } from './UserId.js'

/**
 * Zod schema for UserId
 * Validates UUID format and transforms to branded UserId type
 */
export const UserIdSchema = createIdSchema(UserId.create)

export type UserIdInput = z.input<typeof UserIdSchema>   // string
export type UserIdOutput = z.output<typeof UserIdSchema> // UserId
```

**Archivo:** `/packages/shared/src/domain/ids/refresh-token-id/RefreshTokenId.schema.ts` (NUEVO)

```typescript
import { createIdSchema } from '@domain/utils/zod-id.factory.js'
import { RefreshTokenId } from './RefreshTokenId.js'

/**
 * Zod schema for RefreshTokenId
 * Validates UUID format and transforms to branded RefreshTokenId type
 */
export const RefreshTokenIdSchema = createIdSchema(RefreshTokenId.create)

export type RefreshTokenIdInput = z.input<typeof RefreshTokenIdSchema>   // string
export type RefreshTokenIdOutput = z.output<typeof RefreshTokenIdSchema> // RefreshTokenId
```

**Exports:**

```typescript
// /packages/shared/src/domain/value-objects/team/id/index.ts
export * from './TeamId.js'
export * from './TeamId.schema.js'  // NUEVO

// /packages/shared/src/domain/value-objects/user/id/index.ts
export * from './UserId.js'
export * from './UserId.schema.js'  // NUEVO

// /packages/shared/src/domain/ids/refresh-token-id/index.ts
export * from './RefreshTokenId.js'
export * from './RefreshTokenId.schema.js'  // NUEVO
```

---

## 3. Flujos Específicos

### 3.1 HTTP → Use Case → Repository → DB

**Flujo GET /api/teams/:id**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HTTP REQUEST                                              │
│    GET /api/teams/550e8400-e29b-41d4-a716-446655440000       │
│    Params: { id: "550e8400..." }  ← string                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. HTTP LAYER (teams.ts)                                     │
│    const { id } = TeamParamsSchema.parse(request.params)     │
│    ↓ Zod validates UUID format                               │
│    ↓ TeamId.create(id) validates and brands                  │
│    ✅ id: TeamId (branded type)                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamId
┌─────────────────────────────────────────────────────────────┐
│ 3. USE CASE (GetTeamUseCase)                                 │
│    execute({ id: TeamId })                                   │
│    ↓ Type-safe, no conversion needed                         │
│    await this.teamRepository.findById({ id })                │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamId
┌─────────────────────────────────────────────────────────────┐
│ 4. REPOSITORY (KyselyTeamRepository)                         │
│    findById({ id: TeamId })                                  │
│    ↓ Kysely query                                            │
│    .where('id', '=', id)  ← TeamId used as string            │
│    ↓ Returns DB row                                          │
│    row: { id: string, name: string, ... }                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ DB Row
┌─────────────────────────────────────────────────────────────┐
│ 5. MAPPING (mapToDomain)                                     │
│    Team.create({ id: row.id, name: row.name })               │
│    ↓ TeamId.create(row.id) validates and brands              │
│    ✅ Team { id: TeamId, name: TeamName }                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ Team
┌─────────────────────────────────────────────────────────────┐
│ 6. USE CASE (return)                                         │
│    TeamMapper.toDTO(team)                                    │
│    ↓ Maps to DTO                                             │
│    { id: string, name: string, ... }  ← TeamId → string      │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamResponseDTO
┌─────────────────────────────────────────────────────────────┐
│ 7. HTTP RESPONSE                                             │
│    200 OK                                                    │
│    { success: true, data: { id: "550e8400...", name: "..." } │
└─────────────────────────────────────────────────────────────┘
```

**Tipos en cada paso:**

| Paso | Layer | Tipo de `id` | Conversión |
|------|-------|--------------|------------|
| 1 | HTTP Request | `string` | N/A |
| 2 | HTTP Handler | `TeamId` | Zod: `string` → `TeamId` |
| 3 | Use Case | `TeamId` | No conversion |
| 4 | Repository | `TeamId` | Structural: `TeamId` → `string` (Kysely) |
| 5 | Domain | `TeamId` | Factory: `string` → `TeamId` |
| 6 | Mapper | `string` | Structural: `TeamId` → `string` |
| 7 | HTTP Response | `string` | No conversion |

### 3.2 DB → Repository → Use Case → HTTP

**Flujo Repository.findAll() → HTTP Response**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DATABASE                                                  │
│    SELECT * FROM teams                                       │
│    Returns: TeamRow[] = [{ id: string, name: string, ... }] │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamRow[]
┌─────────────────────────────────────────────────────────────┐
│ 2. REPOSITORY (KyselyTeamRepository)                         │
│    findAll() → Result<Team[], RepositoryError>               │
│    ↓ Map each row                                            │
│    rows.map(row => this.mapToDomain({ team: row }))          │
│    ↓ Team.create({ id: row.id, ... })                        │
│    ↓ Validates: string → TeamId                              │
│    ✅ Team[] with TeamId                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ Team[]
┌─────────────────────────────────────────────────────────────┐
│ 3. USE CASE (ListTeamsUseCase)                               │
│    execute() → Result<TeamsListResponseDTO, RepositoryError> │
│    ↓ Get teams from repository                               │
│    ↓ TeamMapper.toDTOList(teams)                             │
│    ✅ TeamResponseDTO[] with id: string                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ TeamResponseDTO[]
┌─────────────────────────────────────────────────────────────┐
│ 4. HTTP HANDLER (teams.ts)                                   │
│    GET /api/teams                                            │
│    ↓ Returns DTO to client                                   │
│    { success: true, data: { data: [...], meta: {...} } }     │
└─────────────────────────────────────────────────────────────┘
```

**Tipos en cada paso:**

| Paso | Layer | Tipo de `id` | Conversión |
|------|-------|--------------|------------|
| 1 | Database | `string` (UUID column) | N/A |
| 2 | Repository | `TeamId` | Factory: `string` → `TeamId` |
| 3 | Use Case | `string` | Structural: `TeamId` → `string` (Mapper) |
| 4 | HTTP Response | `string` | No conversion |

### 3.3 JWT Payload → Middleware → Route

**Flujo Authentication Middleware**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. HTTP REQUEST                                              │
│    GET /api/protected                                        │
│    Headers: { Authorization: "Bearer eyJhbGc..." }           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE (requireAuth)                                  │
│    AuthService.verifyAuthHeader({ authHeader })              │
│    ↓ Extract token from "Bearer <token>"                     │
│    TokenFactory.verifyAccessToken({ token })                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. TOKEN FACTORY (verifyAccessToken)                         │
│    jwt.verify(token, secret)                                 │
│    ↓ Returns decoded payload (unknown)                       │
│    AccessTokenPayloadSchema.safeParse(decoded)               │
│    ↓ Zod validates and transforms                            │
│    ↓ userId: UserIdSchema → UserId                           │
│    ✅ AccessTokenPayload { userId: UserId, email, role }     │
└─────────────────────────────────────────────────────────────┘
                            ↓ AccessTokenPayload
┌─────────────────────────────────────────────────────────────┐
│ 4. MIDDLEWARE (attach to request)                            │
│    request.user = {                                          │
│      userId: payload.userId,  ← UserId                       │
│      email: payload.email,                                   │
│      role: payload.role                                      │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓ AuthenticatedUser
┌─────────────────────────────────────────────────────────────┐
│ 5. ROUTE HANDLER                                             │
│    const user = request.user                                 │
│    ↓ user.userId is UserId (branded type)                    │
│    ↓ Can be used in use cases that expect UserId             │
│    await someUseCase.execute({ userId: user.userId })        │
└─────────────────────────────────────────────────────────────┘
```

**PROBLEMA ACTUAL:**

```typescript
// AuthService.ts - ANTES
export interface AuthenticatedUser {
  userId: string  // ❌ Debería ser UserId
  email: string
  role: string
}
```

**SOLUCIÓN:**

```typescript
// AuthService.ts - DESPUÉS
export interface AuthenticatedUser {
  userId: UserId  // ✅ Branded type
  email: string
  role: string
}

// Middleware
request.user = {
  userId: payload.userId,  // UserId (validado por Zod)
  email: payload.email,
  role: payload.role
}
```

**Tipos en cada paso:**

| Paso | Layer | Tipo de `userId` | Conversión |
|------|-------|------------------|------------|
| 1 | HTTP Request | `string` (JWT token) | N/A |
| 2 | Middleware | N/A | Extract token |
| 3 | TokenFactory | `UserId` | Zod: `unknown` → `UserId` |
| 4 | Middleware | `UserId` | No conversion |
| 5 | Route Handler | `UserId` | No conversion |

---

## 4. Plan de Implementación

### 4.1 Orden de Cambios

El orden es crítico para no romper tests. Seguir este orden exacto:

**Fase 1: Crear Schemas Zod (Sin Breaking Changes)**

1. Crear schemas Zod para branded types
2. Crear schemas para DTOs de request params
3. Crear schemas para JWT payloads
4. Exportar todos los schemas

**Fase 2: Actualizar JWT Layer**

5. Modificar `TokenFactory` para usar Zod schemas
6. Actualizar `AuthenticatedUser` interface
7. Ejecutar tests de TokenFactory

**Fase 3: Actualizar HTTP Layer**

8. Modificar routes para validar params con Zod
9. Actualizar tipos de request params
10. Ejecutar tests de routes

**Fase 4: Validación Final**

11. Ejecutar todos los tests
12. Verificar types con `tsc --noEmit`

### 4.2 Lista de Archivos a Modificar

#### Archivos NUEVOS

```
packages/shared/src/
├── domain/
│   ├── value-objects/
│   │   ├── team/id/TeamId.schema.ts                    [NUEVO]
│   │   ├── user/id/UserId.schema.ts                     [NUEVO]
│   └── ids/
│       └── refresh-token-id/RefreshTokenId.schema.ts    [NUEVO]
├── dtos/
│   └── request-params.dto.ts                            [NUEVO]
└── application/
    └── factories/TokenFactory.schemas.ts                [NUEVO]
```

#### Archivos MODIFICADOS

```
packages/shared/src/
├── domain/
│   ├── value-objects/
│   │   ├── team/id/index.ts                            [MODIFICAR - export schema]
│   │   ├── user/id/index.ts                             [MODIFICAR - export schema]
│   └── ids/
│       └── refresh-token-id/index.ts                    [MODIFICAR - export schema]
└── dtos/
    └── index.ts                                         [MODIFICAR - export params schemas]

apps/api/src/
├── application/
│   └── factories/
│       └── TokenFactory.ts                              [MODIFICAR - usar Zod]
├── infrastructure/
│   ├── auth/
│   │   └── AuthService.ts                               [MODIFICAR - AuthenticatedUser type]
│   └── http/
│       ├── routes/
│       │   ├── teams.ts                                 [MODIFICAR - validar params]
│       │   └── users.ts                                 [MODIFICAR - validar params]
│       └── middleware/
│           └── auth.ts                                  [MODIFICAR - usar UserId en request.user]
```

### 4.3 Cambios Específicos por Archivo

#### 1. Crear `/packages/shared/src/domain/value-objects/team/id/TeamId.schema.ts`

```typescript
import { z } from 'zod'
import { TeamId } from './TeamId.js'

/**
 * Zod schema for TeamId
 * Validates UUID format and transforms to branded TeamId type
 */
export const TeamIdSchema = z.string().uuid({
  message: 'Team ID must be a valid UUID'
}).transform((val) => {
  const result = TeamId.create(val)
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.value
})

export type TeamIdInput = z.input<typeof TeamIdSchema>  // string
export type TeamIdOutput = z.output<typeof TeamIdSchema>  // TeamId
```

#### 2. Crear `/packages/shared/src/domain/value-objects/user/id/UserId.schema.ts`

```typescript
import { z } from 'zod'
import { UserId } from './UserId.js'

/**
 * Zod schema for UserId
 * Validates UUID format and transforms to branded UserId type
 */
export const UserIdSchema = z.string().uuid({
  message: 'User ID must be a valid UUID'
}).transform((val) => {
  const result = UserId.create(val)
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.value
})

export type UserIdInput = z.input<typeof UserIdSchema>  // string
export type UserIdOutput = z.output<typeof UserIdSchema>  // UserId
```

#### 3. Crear `/packages/shared/src/domain/ids/refresh-token-id/RefreshTokenId.schema.ts`

```typescript
import { z } from 'zod'
import { RefreshTokenId } from './RefreshTokenId.js'

/**
 * Zod schema for RefreshTokenId
 * Validates UUID format and transforms to branded RefreshTokenId type
 */
export const RefreshTokenIdSchema = z.string().uuid({
  message: 'Refresh Token ID must be a valid UUID'
}).transform((val) => {
  const result = RefreshTokenId.create(val)
  if (!result.ok) {
    throw new Error(result.error.message)
  }
  return result.value
})

export type RefreshTokenIdInput = z.input<typeof RefreshTokenIdSchema>  // string
export type RefreshTokenIdOutput = z.output<typeof RefreshTokenIdSchema>  // RefreshTokenId
```

#### 4. Crear `/packages/shared/src/dtos/request-params.dto.ts`

```typescript
import { z } from 'zod'
import { TeamIdSchema } from '@value-objects/team'
import { UserIdSchema } from '@value-objects/user'

/**
 * Request Params DTOs
 * Used to validate and transform URL params in HTTP routes
 */

// Team ID param
export const TeamParamsSchema = z.object({
  id: TeamIdSchema
})
export type TeamParams = z.infer<typeof TeamParamsSchema>

// User ID param
export const UserParamsSchema = z.object({
  id: UserIdSchema
})
export type UserParams = z.infer<typeof UserParamsSchema>
```

#### 5. Crear `/apps/api/src/application/factories/TokenFactory.schemas.ts`

```typescript
import { z } from 'zod'
import { UserIdSchema, RefreshTokenIdSchema } from '@team-pulse/shared'

/**
 * Zod schemas for JWT payloads
 * Used to validate decoded JWT tokens
 */

// Access Token Payload Schema
export const AccessTokenPayloadSchema = z.object({
  userId: UserIdSchema,
  email: z.string().email(),
  role: z.string(),
  // Standard JWT claims
  iat: z.number().optional(),
  exp: z.number().optional(),
  aud: z.string().optional(),
  iss: z.string().optional()
})

export type AccessTokenPayloadInput = z.input<typeof AccessTokenPayloadSchema>
export type AccessTokenPayloadOutput = z.output<typeof AccessTokenPayloadSchema>

// Refresh Token Payload Schema
export const RefreshTokenPayloadSchema = z.object({
  tokenId: RefreshTokenIdSchema,
  userId: UserIdSchema,
  // Standard JWT claims
  iat: z.number().optional(),
  exp: z.number().optional(),
  aud: z.string().optional(),
  iss: z.string().optional()
})

export type RefreshTokenPayloadInput = z.input<typeof RefreshTokenPayloadSchema>
export type RefreshTokenPayloadOutput = z.output<typeof RefreshTokenPayloadSchema>
```

#### 6. Modificar `/packages/shared/src/domain/value-objects/team/id/index.ts`

```typescript
export * from './TeamId.js'
export * from './TeamId.constants.js'
export * from './TeamId.schema.js'  // NUEVO
```

#### 7. Modificar `/packages/shared/src/domain/value-objects/user/id/index.ts`

```typescript
export * from './UserId.js'
export * from './UserId.constants.js'
export * from './UserId.schema.js'  // NUEVO
```

#### 8. Modificar `/packages/shared/src/domain/ids/refresh-token-id/index.ts`

```typescript
export * from './RefreshTokenId.js'
export * from './RefreshTokenId.constants.js'
export * from './RefreshTokenId.schema.js'  // NUEVO
```

#### 9. Modificar `/packages/shared/src/dtos/index.ts`

```typescript
// ... existing exports
export * from './request-params.dto.js'  // NUEVO
```

#### 10. Modificar `/apps/api/src/application/factories/TokenFactory.ts`

**Cambios:**

1. Importar schemas
2. Reemplazar type assertions con Zod validation
3. Remover casting manual

```typescript
// AGREGAR imports
import { AccessTokenPayloadSchema, RefreshTokenPayloadSchema } from './TokenFactory.schemas.js'

export class TokenFactory {
  // ... existing code

  /**
   * Verify an access token
   * CAMBIO: Usar Zod para validar payload en vez de type assertions
   */
  verifyAccessToken({ token }: { token: string }): Result<AccessTokenPayload, AuthenticationError> {
    try {
      const decoded = jwt.verify(token, this.env.JWT_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api'
      })

      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload type (string)')
      }

      // CAMBIO: Usar Zod safeParse en vez de type assertions
      const parseResult = AccessTokenPayloadSchema.safeParse(decoded)

      if (!parseResult.success) {
        throw new Error(`Invalid token payload: ${parseResult.error.message}`)
      }

      // parseResult.data es AccessTokenPayload con UserId validado
      return Ok(parseResult.data)

    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'accessToken' }))
    }
  }

  /**
   * Verify a refresh token
   * CAMBIO: Usar Zod para validar payload
   */
  verifyRefreshToken({ token }: { token: string }): Result<RefreshTokenPayload, AuthenticationError> {
    try {
      const decoded = jwt.verify(token, this.env.JWT_REFRESH_SECRET, {
        audience: 'team-pulse-app',
        issuer: 'team-pulse-api'
      })

      if (typeof decoded === 'string') {
        throw new Error('Invalid token payload type (string)')
      }

      // CAMBIO: Usar Zod safeParse
      const parseResult = RefreshTokenPayloadSchema.safeParse(decoded)

      if (!parseResult.success) {
        throw new Error(`Invalid token payload: ${parseResult.error.message}`)
      }

      return Ok(parseResult.data)

    } catch (error) {
      return Err(TokenFactory.handleJwtError({ error, field: 'refreshToken' }))
    }
  }
}
```

#### 11. Modificar `/apps/api/src/infrastructure/auth/AuthService.ts`

**Cambios:**

1. Actualizar `AuthenticatedUser` interface para usar `UserId`

```typescript
import type { UserId } from '@team-pulse/shared'  // AGREGAR

/**
 * User information extracted from authenticated request
 *
 * CAMBIO: userId es UserId (branded type), no string
 */
export interface AuthenticatedUser {
  userId: UserId  // CAMBIO: string → UserId
  email: string
  role: string
}

export class AuthService {
  // ... resto del código sin cambios

  // El código existente ya funciona porque payload.userId
  // ahora es UserId (gracias al schema de TokenFactory)
}
```

#### 12. Modificar `/apps/api/src/infrastructure/http/middleware/auth.ts`

**No requiere cambios** - Ya está usando `payload.userId` que ahora es `UserId`.

```typescript
// auth.ts - NO CAMBIAR (ya funciona)
export function requireAuth({ tokenFactory }: { tokenFactory: TokenFactory }) {
  const authService = AuthService.create({ tokenFactory })

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const result = authService.verifyAuthHeader({ authHeader: request.headers.authorization })

    if (!result.ok) {
      await reply.code(401).send({ /* ... */ })
      return
    }

    const payload = result.value  // AccessTokenPayload con userId: UserId

    request.user = {
      userId: payload.userId,  // ✅ UserId (gracias al schema)
      email: payload.email,
      role: payload.role
    }
  }
}
```

#### 13. Modificar `/apps/api/src/infrastructure/http/routes/teams.ts`

**Cambios:**

1. Importar `TeamParamsSchema`
2. Validar params con Zod antes de llamar use cases

```typescript
// AGREGAR import
import { TeamParamsSchema, CreateTeamSchema, UpdateTeamSchema, PaginationQuerySchema } from '@team-pulse/shared'

export function registerTeamRoutes(fastify: FastifyInstance, dependencies: TeamRouteDependencies) {
  const { createTeamUseCase, getTeamUseCase, listTeamsUseCase, updateTeamUseCase, deleteTeamUseCase, tokenFactory } = dependencies

  // ... POST /api/teams (sin cambios)

  // ... GET /api/teams (sin cambios)

  /**
   * GET /api/teams/:id
   * CAMBIO: Validar params con TeamParamsSchema
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/teams/:id',
    { preHandler: requireAuth({ tokenFactory }) },
    async (request, reply) => {
      try {
        // CAMBIO: Validar y convertir string → TeamId
        const { id } = TeamParamsSchema.parse(request.params)

        const result = await getTeamUseCase.execute({ id })

        if (!result.ok) {
          const logger = FastifyLogger.create({ logger: request.log })
          return handleError({ error: result.error, logger, reply })
        }

        return reply.code(200).send({
          data: result.value,
          success: true
        })
      } catch (error) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    }
  )

  /**
   * PATCH /api/teams/:id
   * CAMBIO: Validar params con TeamParamsSchema
   */
  fastify.patch<{ Params: { id: string } }>(
    '/api/teams/:id',
    { preHandler: [requireAuth({ tokenFactory }), requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])] },
    async (request, reply) => {
      try {
        // CAMBIO: Validar params
        const { id } = TeamParamsSchema.parse(request.params)
        const dto = UpdateTeamSchema.parse(request.body)

        const result = await updateTeamUseCase.execute({ id, dto })

        if (!result.ok) {
          const logger = FastifyLogger.create({ logger: request.log })
          return handleError({ error: result.error, logger, reply })
        }

        return reply.code(200).send({
          data: result.value,
          success: true
        })
      } catch (error) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    }
  )

  /**
   * DELETE /api/teams/:id
   * CAMBIO: Validar params con TeamParamsSchema
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/teams/:id',
    { preHandler: [requireAuth({ tokenFactory }), requireRole([USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])] },
    async (request, reply) => {
      try {
        // CAMBIO: Validar params
        const { id } = TeamParamsSchema.parse(request.params)

        await deleteTeamUseCase.execute({ id })

        return reply.code(204).send()
      } catch (error) {
        const logger = FastifyLogger.create({ logger: request.log })
        return handleError({ error, logger, reply })
      }
    }
  )
}
```

#### 14. Modificar `/apps/api/src/infrastructure/http/routes/users.ts`

**Cambios:**

1. Importar `UserParamsSchema`
2. Agregar endpoints GET/PATCH/DELETE (si no existen)
3. Validar params con Zod

```typescript
// AGREGAR import
import { UserParamsSchema, CreateUserSchema, UpdateUserSchema, PaginationQuerySchema } from '@team-pulse/shared'

// Agregar endpoints faltantes (GET /api/users/:id, PATCH, DELETE)
// Similar a teams.ts pero usando UserParamsSchema
```

### 4.4 Comandos de Validación

Después de cada fase, ejecutar:

```bash
# 1. Type checking
pnpm tsc --noEmit

# 2. Linting
pnpm lint

# 3. Tests (por fase)
# Fase 2 (JWT)
pnpm test TokenFactory

# Fase 3 (HTTP)
pnpm test routes/teams
pnpm test routes/users
pnpm test routes/auth

# 4. Tests completos
pnpm test

# 5. Build
pnpm build
```

### 4.5 Checklist de Implementación

**Fase 1: Schemas**
- [ ] Crear `TeamId.schema.ts`
- [ ] Crear `UserId.schema.ts`
- [ ] Crear `RefreshTokenId.schema.ts`
- [ ] Crear `request-params.dto.ts`
- [ ] Crear `TokenFactory.schemas.ts`
- [ ] Actualizar exports en `index.ts` files
- [ ] Verificar: `pnpm tsc --noEmit` sin errores

**Fase 2: JWT**
- [ ] Modificar `TokenFactory.ts` - `verifyAccessToken`
- [ ] Modificar `TokenFactory.ts` - `verifyRefreshToken`
- [ ] Modificar `AuthService.ts` - `AuthenticatedUser` interface
- [ ] Ejecutar tests: `pnpm test TokenFactory`
- [ ] Ejecutar tests: `pnpm test AuthService`
- [ ] Verificar: Todos los tests pasan

**Fase 3: HTTP Routes**
- [ ] Modificar `teams.ts` - GET /:id
- [ ] Modificar `teams.ts` - PATCH /:id
- [ ] Modificar `teams.ts` - DELETE /:id
- [ ] Modificar `users.ts` - Endpoints similares
- [ ] Ejecutar tests: `pnpm test routes/teams`
- [ ] Ejecutar tests: `pnpm test routes/users`
- [ ] Verificar: Todos los tests pasan

**Fase 4: Validación Final**
- [ ] Ejecutar: `pnpm tsc --noEmit`
- [ ] Ejecutar: `pnpm lint`
- [ ] Ejecutar: `pnpm test`
- [ ] Ejecutar: `pnpm build`
- [ ] Verificar: Todo pasa sin errores

---

## 5. Resumen

### 5.1 Problemas Resueltos

| Problema | Solución |
|----------|----------|
| HTTP params (string) → Use Case (TeamId) sin validación | Validar con Zod en HTTP layer usando `TeamParamsSchema` |
| JWT payload con múltiples type assertions | Validar con Zod usando `AccessTokenPayloadSchema` |
| `AuthenticatedUser.userId` es string en vez de UserId | Cambiar tipo a `UserId` (automático con schema de JWT) |
| Type assertions en branded type factories | Mantener (son necesarios y seguros) |

### 5.2 Principios Aplicados

1. **Parse, Don't Validate:** Validar en los bordes y convertir a tipos correctos
2. **Type-Safe Throughout:** Branded types en domain/application, primitivos en DTOs
3. **No Manual Casting:** Usar Zod para validación y transformación
4. **Explicit Conversions:** Mappers explícitos (Domain → DTO)

### 5.3 Arquitectura Final

```
HTTP (string)
  → Zod Validation (TeamIdSchema)
  → Application (TeamId)
  → Domain (TeamId)
  → Repository (TeamId → string en DB)
  → DB (string)

DB (string)
  → Repository (Team.create → TeamId)
  → Domain (TeamId)
  → Mapper (TeamId → string)
  → DTO (string)
  → HTTP (string)
```

### 5.4 Type Assertions Permitidos

**Solo en estas ubicaciones:**

1. ✅ Branded type factories (`TeamId.create`, `UserId.create`)
   - Encapsulados
   - Validados antes del `as`

2. ✅ Test mocks (`as unknown as Interface`)
   - Solo en tests
   - No afecta runtime

**NO permitido:**

1. ❌ HTTP layer (usar Zod)
2. ❌ JWT payload parsing (usar Zod)
3. ❌ Conversiones manuales (usar factories o mappers)

---

**Fin del Documento**
