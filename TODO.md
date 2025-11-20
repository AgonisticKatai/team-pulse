# TODO - Technical Debt & Improvements

Este archivo registra mejoras pendientes y tech debt identificado durante el desarrollo del monorepo TeamPulse.

---

## 🔴 Alta Prioridad

### 📦 API - Violaciones de Arquitectura Hexagonal

#### Application Layer importa desde Infrastructure (Env)
**Ubicación:** `apps/api/src/application/factories/TokenFactory.ts:6`
**Problema:** TokenFactory importa tipo `Env` desde `infrastructure/config/env.ts`
**Archivos afectados:**
- `application/factories/TokenFactory.ts`
- `application/factories/TokenFactory.test.ts`
**Violación:** Application solo debe importar de Domain según arquitectura hexagonal
**Solución:**
- Crear interface `IEnvironment` en `domain/config/IEnvironment.ts`
- Infrastructure implementa la interface con valores concretos
- Application usa la interface abstracta, no la implementación
**Impacto:** ALTO - Acopla Application layer con Infrastructure

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
- [ ] `apps/api/src/infrastructure/http/middleware/auth.ts` - Middleware de autenticación JWT

**Infrastructure/HTTP:**
- [ ] `apps/api/src/infrastructure/http/utils/error-handler.ts` - Manejo global de errores
- [ ] `apps/api/src/infrastructure/http/routes/teams.ts` - Rutas HTTP de teams (unit tests)
- [ ] `apps/api/src/infrastructure/http/routes/users.ts` - Rutas HTTP de users (unit tests)

**Infrastructure/Logging:**
- [ ] `apps/api/src/infrastructure/logging/logger-config.ts` - Configuración de logger

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

#### Refactorizar middleware de autenticación para mayor elegancia y consistencia
**Ubicación:** `apps/api/src/infrastructure/http/middleware/auth.ts`
**Acción:** Revisar implementación completa del middleware de autenticación para:
- Evaluar si la función `extractAndVerifyToken` puede hacerse más elegante
- Verificar consistencia con patrones del proyecto (Result<T,E>, named parameters, etc.)
- Considerar separación de responsabilidades (extracción de token vs verificación)
- Analizar manejo de errores y si debería usar nuestros domain errors
- Evaluar si debería inyectarse TokenFactory o JwtService como dependencia
**Razón:** Asegurar que el middleware sigue los mismos estándares de calidad que el resto del código

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
- ✅ Domain tests usan testing utilities de @team-pulse/shared (independiente de Infrastructure) ✅ RESUELTO
- ✅ Testing utilities organizadas con subpath exports en shared package
- ⚠️ Application importa de Infrastructure (TokenFactory - pendiente de refactorizar)

**Calificación General:** 9/10 (subió de 7.5 tras resolver violación crítica del Domain layer)

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
