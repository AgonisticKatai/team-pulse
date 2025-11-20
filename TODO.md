# TODO - Technical Debt & Improvements

Este archivo registra mejoras pendientes y tech debt identificado durante el desarrollo del monorepo TeamPulse.

---

## 🔴 Alta Prioridad

### 📦 API - Tests Faltantes (Archivos Críticos)

**Infrastructure/Config:**
- [ ] `apps/api/src/infrastructure/config/env.ts` - Validación de variables de entorno (CRÍTICO para seguridad)

**Infrastructure/Monitoring:**
- [ ] `apps/api/src/infrastructure/monitoring/MetricsService.ts` - Servicio de métricas de Prometheus

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
