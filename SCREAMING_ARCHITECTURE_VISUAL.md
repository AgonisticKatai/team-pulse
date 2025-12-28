# 🎨 Screaming Architecture - Visualización

## 🔄 Transformación Visual

### ANTES: "¿Qué hace este sistema?" 🤔

```
apps/api/src/
│
📁 domain/           ← "Soy código de dominio"
📁 application/      ← "Soy código de aplicación"
📁 infrastructure/   ← "Soy código de infraestructura"
📄 app.ts
📄 index.ts

❌ No ves las features de negocio
❌ No ves qué hace el sistema
❌ Solo ves organización técnica
```

### DESPUÉS: "¡Ah! Es un sistema de gestión de equipos con autenticación" 💡

```
apps/api/src/
│
📁 features/
│  ├── 🔐 auth/          ← "AUTENTICACIÓN"
│  ├── 👥 users/         ← "GESTIÓN DE USUARIOS"
│  └── ⚽ teams/         ← "GESTIÓN DE EQUIPOS"
│
📁 shared/              ← Infraestructura compartida
📁 core/                ← Framework core

✅ Features de negocio obvias
✅ Arquitectura "grita" el propósito
✅ Auto-documentado
```

---

## 🏗️ Anatomía de un Feature

```
features/auth/                          🔐 Feature: AUTENTICACIÓN
│
├── domain/                             🧠 BUSINESS LOGIC
│   │
│   ├── models/                         📦 Entities & Value Objects
│   │   └── refresh-token/
│   │       ├── RefreshToken.ts         ← Domain entity
│   │       ├── RefreshToken.types.ts   ← Type definitions
│   │       ├── RefreshToken.test.ts    ← Tests
│   │       └── index.ts                ← Barrel export
│   │
│   ├── repositories/                   🔌 Repository Ports
│   │   ├── IRefreshTokenRepository.ts  ← Interface (port)
│   │   └── index.ts
│   │
│   ├── services/                       ⚙️ Domain Service Ports
│   │   ├── IPasswordHasher.ts          ← Interface (port)
│   │   └── index.ts
│   │
│   └── index.ts                        ← Export public API
│
├── application/                        🎯 USE CASES (Orchestration)
│   │
│   ├── use-cases/
│   │   ├── login/                      📝 Use Case: Login
│   │   │   ├── LoginUseCase.ts         ← Business orchestration
│   │   │   ├── LoginUseCase.test.ts    ← Tests
│   │   │   └── index.ts
│   │   │
│   │   ├── logout/                     📝 Use Case: Logout
│   │   │   ├── LogoutUseCase.ts
│   │   │   ├── LogoutUseCase.test.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── refresh-token/              📝 Use Case: Refresh Token
│   │   │   ├── RefreshTokenUseCase.ts
│   │   │   ├── RefreshTokenUseCase.test.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── factories/                      🏭 Object Creation
│   │   ├── TokenFactory.ts             ← JWT creation/validation
│   │   ├── TokenFactory.schemas.ts     ← Zod schemas
│   │   ├── TokenFactory.test.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── infrastructure/                     🔌 ADAPTERS (Implementation)
│   │
│   ├── http/                           🌐 HTTP Adapter
│   │   ├── auth.routes.ts              ← Fastify routes
│   │   ├── auth.routes.test.ts         ← Integration tests
│   │   ├── auth.schemas.ts             ← Request validation
│   │   └── index.ts
│   │
│   ├── repositories/                   💾 Repository Implementations
│   │   ├── KyselyRefreshTokenRepository.ts  ← DB adapter
│   │   ├── KyselyRefreshTokenRepository.test.ts
│   │   └── index.ts
│   │
│   ├── services/                       🔧 Service Implementations
│   │   ├── ScryptPasswordHasher.ts     ← Password hashing
│   │   ├── ScryptPasswordHasher.test.ts
│   │   ├── AuthService.ts              ← JWT utilities
│   │   ├── AuthService.test.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── config/                             ⚙️ DEPENDENCY INJECTION
│   ├── auth.container.ts               ← DI for auth feature
│   └── index.ts
│
└── index.ts                            📦 PUBLIC API
    ↓
    Exports: domain + application
    (infrastructure is encapsulated)
```

---

## 🌊 Flujo de Dependencias

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  HTTP Request: POST /api/auth/login             │
│                                                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  features/auth/infrastructure/http/             │
│  ├── auth.routes.ts                             │
│  │   1. Validate request (Zod schema)           │
│  │   2. Extract LoginDTO                        │
│  │   3. Call loginUseCase.execute(dto)          │
│  └── auth.schemas.ts                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  features/auth/application/use-cases/login/     │
│  ├── LoginUseCase.ts                            │
│  │   1. Find user (via IUserRepository)         │
│  │   2. Verify password (via IPasswordHasher)   │
│  │   3. Generate tokens (via TokenFactory)      │
│  │   4. Store refresh token                     │
│  │   5. Record metrics                          │
│  │   6. Return Result<LoginResponse, Error>     │
│  └── Dependencies (injected):                   │
│      ├── IUserRepository                        │
│      ├── IPasswordHasher                        │
│      ├── IRefreshTokenRepository                │
│      ├── IMetricsService                        │
│      └── TokenFactory                           │
└────────────────┬────────────────────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│  DOMAIN         │ │  INFRASTRUCTURE │
│  ├── User       │ │  ├── Kysely...  │
│  ├── RefreshTok │ │  ├── Scrypt...  │
│  └── Interfaces │ │  └── Metrics... │
└─────────────────┘ └─────────────────┘
    Business Logic      Implementations
    (Pure)              (Dirty)
```

### Regla de Dependencias (Hexagonal)

```
┌──────────────────────────────────────────┐
│                                          │
│         🔌 Infrastructure Layer          │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │      🎯 Application Layer          │ │
│  │                                    │ │
│  │  ┌──────────────────────────────┐ │ │
│  │  │                              │ │ │
│  │  │    🧠 Domain Layer           │ │ │
│  │  │                              │ │ │
│  │  │  - Pure business logic       │ │ │
│  │  │  - No external dependencies  │ │ │
│  │  │  - Framework-agnostic        │ │ │
│  │  │                              │ │ │
│  │  └──────────────────────────────┘ │ │
│  │                                    │ │
│  │  - Orchestrates domain logic      │ │
│  │  - Depends on domain interfaces   │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  - Implements domain interfaces          │
│  - Adapts external services              │
│  - Framework-specific code               │
│                                          │
└──────────────────────────────────────────┘

Dependencies flow INWARD ➡️
```

---

## 🔗 Relaciones entre Features

```
┌────────────────────────────────────────────────┐
│                                                │
│               🎛️ CORE                         │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │  Container Registry                  │     │
│  │  ├── features.auth                   │     │
│  │  ├── features.users                  │     │
│  │  └── features.teams                  │     │
│  └──────────────────────────────────────┘     │
│                                                │
└────────────────┬───────────────────────────────┘
                 │
      ┌──────────┴──────────┐
      │                     │
      ▼                     ▼
┌─────────────┐       ┌─────────────┐
│  FEATURE A  │       │  FEATURE B  │
│             │       │             │
│  🔐 auth    │       │  👥 users   │
│             │       │             │
└──────┬──────┘       └──────┬──────┘
       │                     │
       │   ❌ NO DIRECT      │
       │   DEPENDENCY        │
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
         ┌─────────────────┐
         │                 │
         │  🔧 SHARED      │
         │                 │
         │  ├── database   │
         │  ├── monitoring │
         │  ├── http       │
         │  └── logging    │
         │                 │
         └─────────────────┘

✅ Features usan shared
❌ Features NO se importan entre sí
```

### Anti-Pattern: Feature Coupling

```
❌ MAL:
features/users/
  └── domain/
      └── User.ts
          import { Team } from '@features/teams/domain'  // ❌

✅ BIEN:
features/users/
  └── domain/
      └── User.ts
          // No importa de otros features

Si User necesita Team → crear relación en shared o application layer
```

---

## 📦 Public API de Features

```typescript
// features/auth/index.ts
// ════════════════════════════════════════
// EXPORTED (Public API)
export * from './domain/index.js'      // ✅ Domain models
export * from './application/index.js' // ✅ Use cases

// NOT EXPORTED (Encapsulated)
// - infrastructure/                    // ❌ Implementation details
// - config/                            // ❌ DI configuration

// ════════════════════════════════════════

// Usage from outside:
import { LoginUseCase } from '@features/auth'              // ✅
import { RefreshToken } from '@features/auth/domain'       // ✅

import { AuthService } from '@features/auth/infrastructure' // ❌
```

### Encapsulamiento de Infrastructure

```
┌─────────────────────────────────────┐
│  Feature: auth                      │
│                                     │
│  ┌───────────────┐                 │
│  │  EXPOSED      │                 │
│  │  ────────     │                 │
│  │  ✅ domain    │                 │
│  │  ✅ app       │                 │
│  └───────────────┘                 │
│                                     │
│  ┌───────────────┐                 │
│  │  HIDDEN       │                 │
│  │  ────────     │                 │
│  │  🔒 infra     │                 │
│  │  🔒 config    │                 │
│  └───────────────┘                 │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 Feature Anatomy Comparison

### Feature Simple: Teams

```
features/teams/
├── domain/
│   ├── models/team/        ← 1 entity
│   └── repositories/       ← 1 interface
├── application/
│   ├── use-cases/          ← 5 use cases (CRUD)
│   └── mappers/            ← 1 mapper
├── infrastructure/
│   ├── http/               ← 1 route file
│   └── repositories/       ← 1 repository
└── config/                 ← 1 container

Total: ~15 archivos
```

### Feature Compleja: Auth

```
features/auth/
├── domain/
│   ├── models/
│   │   └── refresh-token/  ← 1 entity
│   ├── repositories/       ← 1 interface
│   └── services/           ← 1 service interface
├── application/
│   ├── use-cases/          ← 3 use cases
│   └── factories/          ← 1 factory
├── infrastructure/
│   ├── http/               ← 1 route file
│   ├── repositories/       ← 1 repository
│   └── services/           ← 2 services
└── config/                 ← 1 container

Total: ~20 archivos
```

---

## 🔄 Migration Path Visualization

```
FASE 1: SHARED
════════════════════════════════════════
infrastructure/database/     →  shared/database/
infrastructure/monitoring/   →  shared/monitoring/
infrastructure/http/         →  shared/http/
infrastructure/logging/      →  shared/logging/
infrastructure/config/       →  shared/config/
infrastructure/testing/      →  shared/testing/


FASE 2.1: FEATURE AUTH
════════════════════════════════════════
domain/models/refresh-token/                 →  features/auth/domain/models/
domain/repositories/IRefreshTokenRepository  →  features/auth/domain/repositories/
domain/services/IPasswordHasher              →  features/auth/domain/services/

application/use-cases/LoginUseCase           →  features/auth/application/use-cases/login/
application/use-cases/LogoutUseCase          →  features/auth/application/use-cases/logout/
application/use-cases/RefreshTokenUseCase    →  features/auth/application/use-cases/refresh-token/
application/factories/TokenFactory           →  features/auth/application/factories/

infrastructure/database/repositories/Kysely… →  features/auth/infrastructure/repositories/
infrastructure/http/routes/auth.ts           →  features/auth/infrastructure/http/auth.routes.ts
infrastructure/auth/AuthService              →  features/auth/infrastructure/services/
infrastructure/auth/ScryptPasswordHasher     →  features/auth/infrastructure/services/


FASE 2.2: FEATURE USERS
════════════════════════════════════════
domain/models/user/                          →  features/users/domain/models/
domain/repositories/IUserRepository          →  features/users/domain/repositories/

application/use-cases/CreateUserUseCase      →  features/users/application/use-cases/create-user/
application/use-cases/ListUsersUseCase       →  features/users/application/use-cases/list-users/
application/use-cases/GetUserUseCase         →  features/users/application/use-cases/get-user/
application/use-cases/UpdateUserUseCase      →  features/users/application/use-cases/update-user/
application/use-cases/DeleteUserUseCase      →  features/users/application/use-cases/delete-user/
application/mappers/UserMapper               →  features/users/application/mappers/

infrastructure/database/repositories/Kysely… →  features/users/infrastructure/repositories/
infrastructure/http/routes/users.ts          →  features/users/infrastructure/http/users.routes.ts


FASE 2.3: FEATURE TEAMS
════════════════════════════════════════
domain/models/team/                          →  features/teams/domain/models/
domain/repositories/ITeamRepository          →  features/teams/domain/repositories/

application/use-cases/CreateTeamUseCase      →  features/teams/application/use-cases/create-team/
application/use-cases/ListTeamsUseCase       →  features/teams/application/use-cases/list-teams/
application/use-cases/GetTeamUseCase         →  features/teams/application/use-cases/get-team/
application/use-cases/UpdateTeamUseCase      →  features/teams/application/use-cases/update-team/
application/use-cases/DeleteTeamUseCase      →  features/teams/application/use-cases/delete-team/
application/mappers/TeamMapper               →  features/teams/application/mappers/

infrastructure/database/repositories/Kysely… →  features/teams/infrastructure/repositories/
infrastructure/http/routes/teams.ts          →  features/teams/infrastructure/http/teams.routes.ts


FASE 3: CORE
════════════════════════════════════════
app.ts                                       →  core/app/app.ts
infrastructure/config/container.ts           →  core/container/Container.ts
                                             +  core/container/registry.ts (nuevo)
```

---

## 📊 Métricas Visuales

### Antes: Dispersión de Código

```
User Feature código distribuido en 4 capas:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

domain/models/user/                       ← Capa 1
  └── User.ts

application/use-cases/                    ← Capa 2
  ├── CreateUserUseCase.ts
  ├── ListUsersUseCase.ts
  └── ...

application/mappers/                      ← Capa 2.5
  └── UserMapper.ts

infrastructure/database/repositories/     ← Capa 3
  └── KyselyUserRepository.ts

infrastructure/http/routes/               ← Capa 4
  └── users.ts

Saltos entre carpetas: 5
Archivos mezclados con otros features: Sí
```

### Después: Cohesión de Código

```
User Feature todo en 1 lugar:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

features/users/
  ├── domain/
  │   └── models/user/User.ts
  ├── application/
  │   ├── use-cases/
  │   │   ├── create-user/
  │   │   ├── list-users/
  │   │   └── ...
  │   └── mappers/UserMapper.ts
  └── infrastructure/
      ├── repositories/KyselyUserRepository.ts
      └── http/users.routes.ts

Saltos entre carpetas: 0 (todo en features/users/)
Archivos mezclados con otros features: No
```

---

## 🎨 Visual Summary

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  SCREAMING ARCHITECTURE                                    │
│  ═══════════════════════════════════════                   │
│                                                            │
│  "What does this system do?"                               │
│                                                            │
│  📂 src/                                                   │
│    ├── 📁 features/          👈 BUSINESS FEATURES          │
│    │   ├── 🔐 auth/          ← Authentication             │
│    │   ├── 👥 users/         ← User Management            │
│    │   └── ⚽ teams/         ← Team Management            │
│    │                                                       │
│    ├── 📁 shared/            👈 INFRASTRUCTURE             │
│    │   ├── 💾 database/                                   │
│    │   ├── 📊 monitoring/                                 │
│    │   ├── 🌐 http/                                       │
│    │   └── 📝 logging/                                    │
│    │                                                       │
│    └── 📁 core/              👈 FRAMEWORK                 │
│        ├── 🎛️ container/                                  │
│        └── 🚀 app/                                        │
│                                                            │
│  ✅ Domain-centric                                         │
│  ✅ Self-documenting                                       │
│  ✅ Feature-autonomous                                     │
│  ✅ Easy to maintain                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
