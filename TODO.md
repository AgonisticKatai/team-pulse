# TODO - Technical Debt & Improvements

Este archivo registra mejoras pendientes y tech debt identificado durante el desarrollo del monorepo TeamPulse.

---

## 🔴 Alta Prioridad

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

#### Analizar arquitectura de middleware de métricas
**Ubicación:** `apps/api/src/infrastructure/http/middleware/metrics.ts`
**Acción:** Evaluar si createMetricsOnRequest/createMetricsOnResponse deberían ser:
- Clases con métodos en lugar de factory functions
- Mantener pattern actual de factories
**Razón:** Determinar el patrón más apropiado según arquitectura del proyecto

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

---

## 📝 Notas

- Este archivo debe actualizarse cada vez que se identifique tech debt en cualquier parte del monorepo
- Organizar tareas por paquete/app: 📦 API, 🌐 Web, 📚 Shared, 🔌 MCP
- Priorizar según impacto en:
  1. Seguridad
  2. Consistencia del código
  3. Mantenibilidad
  4. Performance

**Última actualización:** 2025-11-20
