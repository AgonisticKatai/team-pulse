# TODO - Technical Debt & Improvements

Este archivo registra mejoras pendientes y tech debt identificado durante el desarrollo del monorepo TeamPulse.

---

## 🔴 Alta Prioridad

### 📦 API - Violaciones de Arquitectura Hexagonal

#### ✅ Application Layer importa desde Infrastructure (Env) - RESUELTO (2025-11-20)
**Ubicación:** `apps/api/src/application/factories/TokenFactory.ts:6`
**Problema:** TokenFactory importaba tipo `Env` desde `infrastructure/config/env.ts`
**Solución implementada:**
- ✅ Creada interface `IEnvironment` en `domain/config/IEnvironment.ts`
- ✅ TokenFactory actualizado para usar `IEnvironment` (solo JWT_SECRET y JWT_REFRESH_SECRET)
- ✅ Constructor refactorizado para usar parámetros nombrados (Boy Scout Rule)
- ✅ Infrastructure `Env` es superset de `IEnvironment` (compatibilidad automática)
- ✅ 13 tests pasando
**Resultado:** Application layer ahora solo depende de Domain abstractions

### 📦 API - Tests Faltantes (Archivos Críticos)

**Infrastructure/Config:**
- [x] `apps/api/src/infrastructure/config/env.ts` - Validación de variables de entorno (CRÍTICO para seguridad) - ✅ 26 tests (2025-11-20)

**Infrastructure/Monitoring:**
- [x] `apps/api/src/infrastructure/monitoring/MetricsService.ts` - Servicio de métricas de Prometheus - ✅ 33 tests + Factory pattern + DI + Hexagonal Architecture (2025-11-20)
  - Creadas abstracciones en domain layer: IMetricRegistry, IHistogram, ICounter, IGauge
  - Creados adaptadores de Prometheus en infrastructure layer
  - Servicio completamente desacoplado de prom-client (solo en factory method)

**Infrastructure/Auth:**
- [ ] `apps/api/src/infrastructure/auth/BcryptPasswordHasher.ts` - Password hasher legacy (aunque ya está deprecated)
- [x] `apps/api/src/infrastructure/http/middleware/auth.ts` - Middleware de autenticación JWT - ✅ 21 tests + AuthService (2025-11-21)

**Infrastructure/HTTP:**
- [ ] 🚧 **WIP: Sistema de Gestión de Errores Completo** - Ver diseño detallado abajo
- [ ] `apps/api/src/infrastructure/http/routes/teams.ts` - Rutas HTTP de teams (unit tests)
- [ ] `apps/api/src/infrastructure/http/routes/users.ts` - Rutas HTTP de users (unit tests)

**Infrastructure/Logging:**
- [ ] `apps/api/src/infrastructure/logging/logger-config.ts` - Configuración de logger

---

## 🚧 Work In Progress - Sistema de Gestión de Errores

### 🎯 Objetivo: Error Management System de Excelencia

Crear un sistema de gestión de errores robusto, type-safe, framework-agnostic y ejemplar que pueda ser referencia de mejores prácticas.

### ❌ Problemas Actuales Identificados

**Code Smells Críticos:**
1. **String checking frágil** - `error-handler.ts:74`
   ```typescript
   if (error.message.includes('RefreshToken') || error.message.includes('User'))
   ```
2. **Field checking frágil** - `error-handler.ts:39`
   ```typescript
   if (error.field === 'credentials' || error.field === 'refreshToken')
   ```
3. **Acoplamiento a Fastify** - No puede moverse a shared package
4. **No usa Result<T,E>** - Inconsistente con el resto de la aplicación
5. **Falta semántica clara** - Los errores no "saben" su categoría

### ✨ Arquitectura Propuesta: 5 Capas

```
Layer 5: Framework Adapter (Fastify)     ← apps/api/infrastructure
  - FastifyErrorHandler
  - Thin adapter, solo traduce a Fastify reply
          ↓
Layer 4: Error Handler Service           ← @team-pulse/shared/errors
  - ErrorHandler (framework-agnostic)
  - Category → HTTP status mapping
  - ErrorResponse (agnostic interface)
          ↓
Layer 3: Domain Errors                   ← @team-pulse/shared/errors
  - ValidationError, AuthenticationError
  - AuthorizationError, NotFoundError
  - ConflictError, BusinessRuleError, etc.
          ↓
Layer 2: Base Error System               ← @team-pulse/shared/errors
  - IApplicationError (interface)
  - ApplicationError (base class)
  - ErrorCategory, ErrorSeverity types
          ↓
Layer 1: Result Integration              ← @team-pulse/shared/result
  - Result<T, ApplicationError>
  - unwrapResult, tryCatch helpers
```

### 🏗️ Componentes Clave

#### Layer 2: Base Error System
```typescript
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export type ErrorCategory =
  | 'validation'      // 400
  | 'authentication'  // 401
  | 'authorization'   // 403
  | 'not_found'       // 404
  | 'conflict'        // 409
  | 'business_rule'   // 422
  | 'external'        // 502
  | 'internal'        // 500

export interface IApplicationError {
  readonly code: string
  readonly message: string
  readonly category: ErrorCategory  // ← Semántica REAL, no strings
  readonly severity: ErrorSeverity  // ← Para logging/monitoring
  readonly timestamp: Date
  readonly metadata?: Record<string, unknown>
  readonly isOperational: boolean   // ← Safe to expose?

  withContext(ctx: Record<string, unknown>): IApplicationError
  toJSON(): object
}

export abstract class ApplicationError extends Error implements IApplicationError {
  // Implementación base con constructor privado + factory methods
}
```

#### Layer 3: Domain-Specific Errors
```typescript
export class AuthenticationError extends ApplicationError {
  readonly code = 'AUTHENTICATION_ERROR'
  readonly category = 'authentication' as const

  static invalidCredentials(): AuthenticationError
  static invalidToken(): AuthenticationError
  static missingToken(): AuthenticationError
}

export class AuthorizationError extends ApplicationError {
  readonly code = 'AUTHORIZATION_ERROR'
  readonly category = 'authorization' as const

  static insufficientPermissions(required: string[], actual: string): AuthorizationError
}
```

#### Layer 4: Framework-Agnostic Handler
```typescript
export interface ErrorResponse {
  statusCode: number
  body: {
    success: false
    error: {
      code: string
      message: string
      details?: Record<string, unknown>
    }
  }
}

export class ErrorHandler {
  static toResponse(error: unknown): ErrorResponse {
    // Mapping puro sin lógica condicional basada en strings
    if (error instanceof ApplicationError) {
      return {
        statusCode: CATEGORY_TO_HTTP[error.category],
        body: { /* ... */ }
      }
    }
  }
}
```

#### Layer 5: Fastify Adapter
```typescript
export class FastifyErrorHandler {
  static handle({ error, reply }: { error: unknown; reply: FastifyReply }) {
    const response = ErrorHandler.toResponse(error)  // ← Usa core agnóstico
    this.logError(error, response.statusCode)
    reply.code(response.statusCode).send(response.body)
  }
}
```

### ✅ Características y Ventajas

**Arquitectura:**
- ✅ Zero coupling - Core 100% framework-agnostic
- ✅ Proper separation of concerns - 5 capas claramente definidas
- ✅ Can live in shared package - Reutilizable en toda la monorepo

**Type Safety:**
- ✅ Type-safe throughout - TypeScript compiler te protege
- ✅ No string checking - Todo basado en tipos/categorías
- ✅ Exhaustive pattern matching - Imposible olvidar casos

**Integration:**
- ✅ Result<T,E> first-class - Integración perfecta con Railway-Oriented Programming
- ✅ No throw exceptions - Todo vía Result (control flow explícito)
- ✅ Rich error context - Metadata, severity, timestamps, cause chain

**Production Ready:**
- ✅ Logging by severity - Solo loggea errores críticos
- ✅ Hide internal errors - isOperational flag protege información sensible
- ✅ Stack traces preserved - No pierdes debugging info
- ✅ Observability ready - Metadata para monitoring/alerting

**Developer Experience:**
- ✅ Factory methods - API clara y descubrible
- ✅ Testable in isolation - Cada capa testeable independientemente
- ✅ Extensible - Nuevos errores sin cambiar handler
- ✅ Self-documenting - El código explica el dominio

### 📋 Plan de Implementación

**Fase 1: Core Error System (Shared Package)** ✅ COMPLETADO (2025-11-26)
1. [x] Crear `packages/shared/src/errors/core.ts`
   - IApplicationError interface
   - ApplicationError base class
   - ERROR_CATEGORY y ERROR_SEVERITY constants (enum-like)
2. [x] Crear errores específicos con factory methods:
   - ValidationError, AuthenticationError, AuthorizationError
   - NotFoundError, ConflictError, BusinessRuleError
   - InternalError, ExternalServiceError
3. [x] Crear tests exhaustivos para cada error type (243 tests pasando)
4. [x] Configurar subpath exports en shared package
**Resultado:** Sistema de errores type-safe y framework-agnostic funcionando

**Fase 2: Framework-Agnostic Handler** ✅ COMPLETADO (2025-11-26)
5. [x] Crear `packages/shared/src/errors/handler/error-handler.ts`
   - ErrorHandler service con método handle()
   - Logging basado en severity (ILogger interface)
   - Safe error responses (oculta detalles internos)
6. [x] Crear `packages/shared/src/errors/handler/http-status-codes.ts`
   - HTTP_STATUS constants
   - ERROR_CATEGORY_TO_HTTP_STATUS mapping (usando computed property names)
7. [x] Crear `packages/shared/src/errors/handler/error-response.ts`
   - createSafeErrorResponse() function
8. [x] Crear `packages/shared/src/errors/handler/logger.ts`
   - ILogger interface
   - ConsoleLogger y NoOpLogger implementations
9. [x] Tests para ErrorHandler con todos los casos (70 tests adicionales = 313 tests totales)
10. [x] Resolver warnings de linter con biome-ignore contextuales
**Resultado:** Handler framework-agnostic completo con logging y mapeo HTTP

**Fase 3: Integración en API** 🚧 EN PROGRESO (2025-11-26)
11. [x] Crear adapter FastifyLogger para ILogger - ✅ 9 tests pasando
    - Mapear ILogger a fastify.log
    - Implementar ILogger interface usando Fastify logger
    - Extender TEST_CONSTANTS con logContext
12. [ ] Migrar errores del domain de API
    - Eliminar `apps/api/src/domain/errors/` (DomainError, ValidationError, etc.)
    - Actualizar imports para usar `@team-pulse/shared/errors`
    - Verificar que use cases compilan correctamente
13. [x] Crear FastifyErrorHandler - ✅ 6 tests pasando
    - Crear `apps/api/src/infrastructure/http/middleware/error-handler.ts`
    - Usar ErrorHandler de shared
    - Integrar con FastifyLogger
    - Función handleError() para routes
14. [ ] Actualizar routes para usar nuevo error handling
    - auth.ts, users.ts, teams.ts
    - Reemplazar handleError legacy con nuevo
15. [ ] Actualizar app.ts
    - Integrar FastifyErrorHandler en global error handler
    - Eliminar lógica de error handling legacy
16. [ ] Tests de integración
    - Verificar que todos los tests existentes pasen (800+)
17. [ ] Eliminar código legacy
    - Eliminar `apps/api/src/infrastructure/http/utils/error-handler.ts`
    - Eliminar `apps/api/src/domain/errors/` completo
18. [x] Type-check ✅ Pasando sin errores
19. [ ] Lint y type-check final después de integración completa

**Fase 4: Documentation**
19. [ ] Documentar patrón en AGREEMENTS.md
20. [ ] Crear ejemplos de uso en TESTING.md
21. [ ] Actualizar TODO.md con resultado final

### 🎯 Resultado Esperado

Un sistema de gestión de errores que sea:
- **Referencia de excelencia** - Digno de mostrar como ejemplo
- **Type-safe** - El compilador previene errores
- **Framework-agnostic** - Reutilizable en cualquier contexto
- **Production-ready** - Logging, security, observability
- **Developer-friendly** - API clara, tests claros, fácil de extender

**Estado:** 🚧 WIP - Diseño aprobado, pendiente implementación (2025-11-21)

---

## 🟡 Media Prioridad

### 📦 API - Auditorías y Refactoring

#### Centralizar nombres de métricas en constantes compartidas
**Ubicación:** `apps/api/src/infrastructure/monitoring/`
**Acción:** Los nombres de métricas (http_request_duration_seconds, http_requests_total, etc.) están hardcodeados en:
- PrometheusMetricsFactory (creación de métricas)
- MetricsService.test.ts (verificación en tests)
**Solución:** Crear constantes compartidas para nombres de métricas que puedan ser usadas tanto por factory como por tests

#### Revisar TEST_CONSTANTS para mejoras de tipado y estructura
**Ubicación:** `apps/api/src/infrastructure/testing/test-constants.ts`
**Acción:** Auditar estructura completa de TEST_CONSTANTS para:
- Mejoras en tipado (usar tipos más específicos donde sea posible)
- Organización y consistencia de la estructura
- Identificar oportunidades de mejora en la arquitectura del archivo

#### Evaluar impacto de cambio private → protected en Value Objects y Entities
**Ubicación:** `apps/api/src/domain/models/`, `apps/api/src/domain/value-objects/`
**Contexto:** Cambiamos métodos y constantes `private static` a `protected static` para evitar falso positivo de Biome
**Problema detectado:** Biome `noUnusedPrivateClassMembers` no detecta uso de métodos privados estáticos dentro de la misma clase
**Solución aplicada:** Usar `protected` en lugar de `private` para métodos/constantes estáticos
**Archivos afectados:**
- Value Objects: EntityId, Email, TeamName, City, FoundedYear, Pagination, Role
- Entities: User, Team, RefreshToken
- Factory: TokenFactory
**Debate:**
- `protected` permite acceso en subclases (aunque actualmente no usamos herencia)
- `private` sería más estricto pero causa falso positivo en Biome
- Trade-off aceptable mientras no haya herencia
**Acciones futuras:**
1. Monitorear si Biome corrige este bug en futuras versiones
2. Si se introduce herencia, reevaluar si `protected` es apropiado
3. Considerar alternativas si el diseño cambia (inline validations, deshabilitar regla, etc.)

#### Analizar arquitectura de middleware de métricas
**Ubicación:** `apps/api/src/infrastructure/http/middleware/metrics.ts`
**Acción:** Evaluar si createMetricsOnRequest/createMetricsOnResponse deberían ser:
- Clases con métodos en lugar de factory functions
- Mantener pattern actual de factories
**Razón:** Determinar el patrón más apropiado según arquitectura del proyecto

#### ✅ Refactorizar middleware de autenticación - COMPLETADO (2025-11-21)
**Ubicación:** `apps/api/src/infrastructure/http/middleware/auth.ts` + `AuthService.ts`
**Solución implementada (TDD):**
- ✅ Creado AuthService con factory pattern y constructor privado
- ✅ Usa Result<T, E> para manejo de errores (Railway-Oriented Programming)
- ✅ Parámetros nombrados en todos los métodos
- ✅ Retorna ValidationError (domain errors) en lugar de throw
- ✅ Separación de responsabilidades: AuthService (lógica) vs middleware (HTTP)
- ✅ TokenFactory inyectado via DI
- ✅ **21 tests comprehensivos** siguiendo AAA pattern
**Resultado:** 100% consistente con patrones del proyecto

#### Limpiar funciones duplicadas de DTO builders en infrastructure/testing
**Ubicación:** `apps/api/src/infrastructure/testing/auth-builders.ts`, `user-builders.ts`, `team-builders.ts`
**Problema:** Tras mover DTO builders a `@team-pulse/shared/testing/dto-builders`, las funciones originales siguen en infrastructure/testing:
- `buildLoginDTO()` y `buildRefreshTokenDTO()` en auth-builders.ts
- `buildCreateUserDTO()` en user-builders.ts
- `buildCreateTeamDTO()` en team-builders.ts
**Impacto:** Cosmético - No causa problemas funcionales (nadie las usa desde infrastructure)
**Solución:**
- Eliminar las funciones de DTO builders de los archivos en infrastructure/testing
- Mantener solo las funciones de entity builders (buildUser, buildTeam, buildRefreshToken, etc.)
- Actualizar comentarios si es necesario
**Razón:** Evitar código duplicado y mantener single source of truth

#### Evaluar solución más elegante para IEnvironment naming convention
**Ubicación:** `apps/api/src/domain/config/IEnvironment.ts`
**Problema actual:** Propiedades usan SCREAMING_SNAKE_CASE (JWT_SECRET, JWT_REFRESH_SECRET) para coincidir con env vars, pero Biome lint quiere camelCase
**Solución temporal:** Usando `biome-ignore` con justificación (aplicado 2025-11-20)
**Análisis pendiente:**
- ¿Deberíamos usar camelCase en la interfaz (jwtSecret) y mapear en Infrastructure?
- ¿Configurar Biome para permitir SCREAMING_SNAKE_CASE en interfaces de config?
- ¿Es mejor mantener consistencia con env vars o con convenciones TypeScript?
- Evaluar trade-offs: consistencia vs mapping explícito
**Objetivo:** Determinar approach más correcto según mejores prácticas del proyecto

#### Unificar convenciones de definición de tipos TypeScript
**Ubicación:** Todo el proyecto (apps/api, packages/shared, etc.)
**Acción:** Auditar y estandarizar dónde y cómo definimos tipos en TypeScript:
- `type` vs `interface` - Cuándo usar cada uno
- Tipos inline vs extraídos
- Ubicación de definiciones de tipos (mismo archivo, archivos .types.ts, etc.)
- Nomenclatura y convenciones de naming
**Objetivo:** Establecer guía de estilo clara y consistente para definiciones de tipos en todo el monorepo

#### Revisar implementación de ScryptPasswordHasher
**Ubicación:** `apps/api/src/infrastructure/auth/ScryptPasswordHasher.ts`
**Acción:** Auditar la implementación completa para verificar:
- Corrección del formato de hash (cost:blockSize:parallelization:salt:hash)
- Manejo adecuado de parámetros en verify()
- Seguridad de la implementación (timing-safe comparison, random salt)
- Cobertura de tests (edge cases, security properties)

#### Revisar tests de Domain Errors para beforeAll
**Ubicación:** `apps/api/src/domain/errors/*.test.ts`
**Acción:** Auditar tests de modelos de errores para verificar:
- Uso correcto de beforeAll para instanciación
- No instanciar clases dentro de cada test individual
- Consistencia con patrones del proyecto

#### Revisar otros Use Case tests por patrones similares
**Ubicación:** `apps/api/src/application/use-cases/*.test.ts`
**Acción:** Auditar ListTeamsUseCase.test.ts y otros para patrones similares a ListUsersUseCase

---

## 🟢 Baja Prioridad

### 📦 API - Testing Helpers

#### Considerar helpers adicionales
**Ubicación:** `apps/api/src/infrastructure/testing/`
**Tareas:**
- `expectEmpty()` - Para arrays vacíos
- `expectNonEmpty()` - Para arrays con al menos 1 elemento
- Evaluar necesidad basada en patrones recurrentes

---

## ✅ Completado

### 📦 API - Hexagonal Architecture Fix (2025-11-20)
- [x] Identificar violación de arquitectura (Application → Infrastructure en TokenFactory)
- [x] Crear interface IEnvironment en domain/config
- [x] Actualizar TokenFactory para usar IEnvironment en lugar de Env
- [x] Aplicar Boy Scout Rule: Refactorizar constructor para usar parámetros nombrados
- [x] Crear TEST_TOKEN_ENV (IEnvironment) en test-env.ts para tests explícitos
- [x] Actualizar TokenFactory.test.ts para usar TEST_TOKEN_ENV
- [x] Verificar que no existan otras violaciones en Application layer
- [x] Actualizar TODO.md con resolución
- [x] **Resultado:** 793 tests pasando, arquitectura hexagonal perfecta (10/10), tests auto-documentados

### 📦 API - Testing & Best Practices (2025-11-20)
- [x] Crear TESTING.md con best practices
- [x] Crear helpers (expectSingle, expectFirst, expectArrayOfLength)
- [x] Ampliar TEST_CONSTANTS (emails.existing, emails.nonexistent, first, second, third)
- [x] Refactorizar RefreshToken.test.ts (usar TEST_CONSTANTS)
- [x] Refactorizar Team.test.ts (usar TEST_CONSTANTS)
- [x] Refactorizar UpdateTeamUseCase.test.ts (usar expectSuccess)
- [x] Crear tests para Domain Errors (153 tests)
- [x] Refactorizar ListUsersUseCase.test.ts (eliminar hardcoded, usar expectFirst, corregir mocks con Err())

### 📦 API - Architecture & Patterns (2025-11-20)
- [x] Aplicar patrón creacional a Domain Errors (constructores privados en ValidationError, DuplicatedError, NotFoundError)
- [x] Migrar código a factory methods (actualizar todos los tests de Domain Errors)

### 📦 API - Password Hashing Migration (2025-11-20)
- [x] Crear tests para BcryptPasswordHasher (24 tests)
- [x] Migrar DrizzleUserRepository.test.ts a ScryptPasswordHasher
- [x] Migrar DrizzleRefreshTokenRepository.test.ts a ScryptPasswordHasher
- [x] Migrar auth.test.ts a ScryptPasswordHasher
- [x] Migrar protected.test.ts a ScryptPasswordHasher
- [x] Migrar seed-super-admin.ts a ScryptPasswordHasher
- [x] Eliminar archivos legacy password-utils.ts y password-utils.test.ts
- [x] **Resultado:** 704 tests pasando, migración completa exitosa

### 📦 Shared - Refactorización de Testing Utilities con Subpath Exports (2025-11-20)
- [x] **Problema resuelto:** Domain Layer importaba desde Infrastructure (violación crítica de arquitectura hexagonal)
- [x] **Solución implementada:** Mover testing utilities a `@team-pulse/shared` con subpath exports organizados
- [x] Reorganizar `packages/shared/src/testing/`:
  - Crear `helpers.ts` combinando assertion, result y mock helpers
  - Crear `constants.ts` con TEST_CONSTANTS
  - Crear `dto-builders.ts` con builders de DTOs (buildCreateUserDTO, buildLoginDTO, buildCreateTeamDTO)
- [x] Configurar subpath exports en `package.json`:
  - `@team-pulse/shared/result` → Result<T,E>, Ok, Err, map, flatMap
  - `@team-pulse/shared/dtos` → DTOs con Zod schemas
  - `@team-pulse/shared/types` → Tipos compartidos
  - `@team-pulse/shared/testing/helpers` → expectSuccess, expectError, expectZodError, etc.
  - `@team-pulse/shared/testing/constants` → TEST_CONSTANTS
  - `@team-pulse/shared/testing/dto-builders` → Builders de DTOs
- [x] Eliminar barrel exports del index principal (solo documentación)
- [x] Mantener entity builders en `infrastructure/testing` (buildUser, buildTeam, buildRefreshToken)
- [x] Actualizar 100+ archivos con imports organizados
- [x] **Resultado:** 793 tests pasando, 0 errores TypeScript, arquitectura hexagonal respetada

---

## ✨ Reconocimientos de Arquitectura

### 📦 API - Implementación Correcta (Revisión 2025-11-20)

**Naming Conventions - PERFECTO:**
- ✅ Use Cases siguen patrón `{Action}{Entity}UseCase`
- ✅ Repository Interfaces siguen patrón `I{Name}Repository`
- ✅ Repository Implementations siguen patrón `{Implementation}{Entity}Repository`

**DDD Patterns - EXCELENTE:**
- ✅ Rich Entities con validación y comportamiento encapsulado (User, Team, RefreshToken)
- ✅ Value Objects inmutables y auto-validantes (Email, EntityId, Role, TeamName, City, FoundedYear, Pagination)
- ✅ Use Cases con single responsibility
- ✅ Factory methods con constructores privados

**Repository Pattern - CORRECTO:**
- ✅ Interfaces definidas en Domain layer
- ✅ Implementaciones en Infrastructure layer
- ✅ Dependency injection correcta
- ✅ Mapping entre domain entities y database rows

**Hexagonal Architecture - EXCELENTE (Actualizado 2025-11-20):**
- ✅ Infrastructure depende de Domain (correcto)
- ✅ Infrastructure implementa interfaces de Domain (correcto)
- ✅ Domain tests usan testing utilities de @team-pulse/shared (independiente de Infrastructure)
- ✅ Testing utilities organizadas con subpath exports en shared package
- ✅ Application solo depende de Domain abstractions (IEnvironment) ✅ RESUELTO (2025-11-20)

**Calificación General:** 10/10 (arquitectura hexagonal perfectamente implementada)

---

## 📝 Notas

- Este archivo debe actualizarse cada vez que se identifique tech debt en cualquier parte del monorepo
- Organizar tareas por paquete/app: 📦 API, 🌐 Web, 📚 Shared, 🔌 MCP
- Priorizar según impacto en:
  1. Seguridad
  2. Consistencia del código
  3. Mantenibilidad
  4. Performance

**Última revisión de arquitectura:** 2025-11-20
**Última actualización:** 2025-11-20
