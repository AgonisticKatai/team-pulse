# 🏗️ Screaming Architecture - Team Pulse API

> **Objetivo**: Migrar de organización por capas técnicas a organización por features de negocio, donde el dominio "grita" desde la estructura de carpetas.

## 📋 Índice

1. [Filosofía](#filosofía)
2. [Estructura Propuesta](#estructura-propuesta)
3. [Principios de Diseño](#principios-de-diseño)
4. [Organización por Feature](#organización-por-feature)
5. [Comparativa Antes/Después](#comparativa-antesdespués)
6. [Plan de Migración](#plan-de-migración)
7. [Convenciones y Reglas](#convenciones-y-reglas)

---

## 🎯 Filosofía

### Screaming Architecture (Uncle Bob)

> "Your architecture should scream the intent of the system, not the frameworks it uses"

**Antes (Organización Técnica):**
```
src/
├── domain/         ← "Soy una capa técnica"
├── application/    ← "Soy una capa técnica"
└── infrastructure/ ← "Soy una capa técnica"
```
❌ **Problema**: No puedes ver QUÉ hace el sistema, solo CÓMO está organizado técnicamente.

**Después (Organización por Dominio):**
```
src/
├── features/
│   ├── auth/           ← "Soy autenticación"
│   ├── users/          ← "Soy gestión de usuarios"
│   └── teams/          ← "Soy gestión de equipos"
├── shared/             ← "Soy infraestructura compartida"
└── core/               ← "Soy el núcleo del framework"
```
✅ **Solución**: Ves inmediatamente QUÉ hace el sistema mirando las carpetas.

---

## 🏛️ Estructura Propuesta

### Visión General

```
apps/api/src/
│
├── features/                           # 🎯 FEATURES DE NEGOCIO (SCREAMING!)
│   │
│   ├── auth/                           # Feature: Autenticación
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── refresh-token/
│   │   │   │   │   ├── RefreshToken.ts
│   │   │   │   │   ├── RefreshToken.types.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── IPasswordHasher.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── IRefreshTokenRepository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── login/
│   │   │   │   │   ├── LoginUseCase.ts
│   │   │   │   │   ├── LoginUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── logout/
│   │   │   │   │   ├── LogoutUseCase.ts
│   │   │   │   │   ├── LogoutUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── refresh-token/
│   │   │   │   │   ├── RefreshTokenUseCase.ts
│   │   │   │   │   ├── RefreshTokenUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── factories/
│   │   │   │   ├── TokenFactory.ts
│   │   │   │   ├── TokenFactory.schemas.ts
│   │   │   │   ├── TokenFactory.test.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── http/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── auth.routes.test.ts
│   │   │   │   ├── auth.schemas.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── KyselyRefreshTokenRepository.ts
│   │   │   │   ├── KyselyRefreshTokenRepository.test.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── ScryptPasswordHasher.ts
│   │   │   │   ├── ScryptPasswordHasher.test.ts
│   │   │   │   ├── AuthService.ts
│   │   │   │   ├── AuthService.test.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── config/
│   │   │   ├── auth.container.ts      # DI para auth
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                    # Barrel export del feature
│   │
│   ├── users/                          # Feature: Gestión de Usuarios
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── user/
│   │   │   │   │   ├── User.ts
│   │   │   │   │   ├── User.types.ts
│   │   │   │   │   ├── User.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── IUserRepository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-user/
│   │   │   │   │   ├── CreateUserUseCase.ts
│   │   │   │   │   ├── CreateUserUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── list-users/
│   │   │   │   │   ├── ListUsersUseCase.ts
│   │   │   │   │   ├── ListUsersUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── get-user/
│   │   │   │   │   ├── GetUserUseCase.ts
│   │   │   │   │   ├── GetUserUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── update-user/
│   │   │   │   │   ├── UpdateUserUseCase.ts
│   │   │   │   │   ├── UpdateUserUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── delete-user/
│   │   │   │   │   ├── DeleteUserUseCase.ts
│   │   │   │   │   ├── DeleteUserUseCase.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── mappers/
│   │   │   │   ├── UserMapper.ts
│   │   │   │   ├── UserMapper.test.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── http/
│   │   │   │   ├── users.routes.ts
│   │   │   │   ├── users.routes.test.ts
│   │   │   │   ├── users.schemas.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── KyselyUserRepository.ts
│   │   │   │   ├── KyselyUserRepository.test.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── config/
│   │   │   ├── users.container.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   ├── teams/                          # Feature: Gestión de Equipos
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── team/
│   │   │   │   │   ├── Team.ts
│   │   │   │   │   ├── Team.types.ts
│   │   │   │   │   ├── Team.test.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── ITeamRepository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── create-team/
│   │   │   │   ├── list-teams/
│   │   │   │   ├── get-team/
│   │   │   │   ├── update-team/
│   │   │   │   ├── delete-team/
│   │   │   │   └── index.ts
│   │   │   ├── mappers/
│   │   │   │   ├── TeamMapper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   ├── http/
│   │   │   │   ├── teams.routes.ts
│   │   │   │   ├── teams.routes.test.ts
│   │   │   │   ├── teams.schemas.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── KyselyTeamRepository.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── config/
│   │   │   ├── teams.container.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts
│   │
│   └── index.ts                        # Re-export de todos los features
│
├── shared/                             # 🔧 INFRAESTRUCTURA COMPARTIDA
│   │
│   ├── database/                       # Database compartido entre features
│   │   ├── connection.ts
│   │   ├── kysely-schema.ts
│   │   ├── migrator.ts
│   │   ├── migrations/
│   │   │   └── 001_initial_schema.ts
│   │   └── index.ts
│   │
│   ├── monitoring/                     # Monitoring compartido
│   │   ├── domain/
│   │   │   ├── IMetricsService.ts
│   │   │   ├── metric-types.ts
│   │   │   └── index.ts
│   │   ├── infrastructure/
│   │   │   ├── MetricsService.ts
│   │   │   ├── prometheus/
│   │   │   │   ├── adapters/
│   │   │   │   ├── PrometheusMetricsFactory.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── http/                           # HTTP middleware compartido
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # Auth middleware
│   │   │   ├── error-handler.ts
│   │   │   ├── correlation-id.ts
│   │   │   ├── metrics.ts
│   │   │   ├── compression.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── logging/                        # Logging compartido
│   │   ├── FastifyLogger.ts
│   │   ├── logger-config.ts
│   │   └── index.ts
│   │
│   ├── config/                         # Config compartido
│   │   ├── env.ts
│   │   ├── IEnvironment.ts
│   │   └── index.ts
│   │
│   ├── testing/                        # Testing utilities compartido
│   │   ├── test-env.ts
│   │   ├── test-helpers.ts
│   │   ├── user-builders.ts
│   │   ├── team-builders.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── core/                               # 🎛️ NÚCLEO DEL FRAMEWORK
│   │
│   ├── container/                      # Dependency Injection
│   │   ├── Container.ts                # Main container
│   │   ├── registry.ts                 # Feature registry
│   │   └── index.ts
│   │
│   ├── app/                            # App composition
│   │   ├── app.ts                      # Fastify app setup
│   │   ├── app.test.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── scripts/                            # 🔨 SCRIPTS CLI
│   ├── seed-super-admin.ts
│   ├── run-kysely-migrations.ts
│   └── index.ts
│
└── index.ts                            # 🚀 ENTRY POINT
```

---

## 🎨 Principios de Diseño

### 1. **Feature-First Organization**

Cada feature es **autónoma** y contiene TODO lo necesario:
- ✅ Domain models propios
- ✅ Use cases propios
- ✅ Infrastructure adapters propios
- ✅ HTTP routes propios
- ✅ DI container propio

**Ventajas:**
- Fácil de entender (todo relacionado está junto)
- Fácil de borrar (eliminas carpeta = eliminas feature)
- Fácil de testear (scope reducido)
- Equipos pueden trabajar en features diferentes sin conflictos

### 2. **Vertical Slicing** (vs Horizontal Slicing)

**Antes (Horizontal):**
```
domain/models/user/
application/use-cases/CreateUserUseCase.ts
infrastructure/repositories/KyselyUserRepository.ts
infrastructure/http/routes/users.ts
```
❌ Cambio en "users" requiere tocar 4 carpetas diferentes

**Después (Vertical):**
```
features/users/
  ├── domain/models/user/
  ├── application/use-cases/create-user/
  ├── infrastructure/repositories/
  └── infrastructure/http/
```
✅ Cambio en "users" se hace todo en una carpeta

### 3. **Hexagonal Architecture Preservada**

Cada feature mantiene Hexagonal internamente:

```
features/users/
  ├── domain/          ← Núcleo de negocio (sin dependencias externas)
  ├── application/     ← Orquestación (depende de domain)
  └── infrastructure/  ← Adaptadores (depende de domain + application)
```

**Regla de dependencias:**
```
infrastructure → application → domain
       ↓              ↓           ↓
    Adapters      Use Cases   Business Logic
```

### 4. **Shared vs Feature Code**

**Regla de oro:**

| Tipo | Ubicación | Ejemplo |
|------|-----------|---------|
| **Feature-specific** | `features/{feature}/` | `User`, `CreateUserUseCase`, `KyselyUserRepository` |
| **Shared by multiple features** | `shared/` | `IMetricsService`, `database connection`, `error-handler middleware` |
| **Framework core** | `core/` | `Container`, `app setup`, `feature registry` |

**Excepciones:**
- Si 2 features comparten algo → `shared/`
- Si 3+ features comparten algo → definitivamente `shared/`

### 5. **Self-Documenting Structure**

```typescript
// ❌ ANTES: No sabes qué hace sin abrir archivos
src/
  application/
    use-cases/
      CreateUserUseCase.ts
      LoginUseCase.ts
      CreateTeamUseCase.ts

// ✅ DESPUÉS: Ves inmediatamente las features del sistema
src/
  features/
    users/     ← "Tenemos gestión de usuarios"
    teams/     ← "Tenemos gestión de equipos"
    auth/      ← "Tenemos autenticación"
```

---

## 📦 Organización por Feature

### Anatomía de un Feature

Cada feature sigue esta estructura consistente:

```
features/{feature-name}/
│
├── domain/                     # 🧠 BUSINESS LOGIC
│   ├── models/                 # Entities & Value Objects
│   ├── repositories/           # Repository interfaces (ports)
│   ├── services/               # Domain service interfaces
│   └── index.ts
│
├── application/                # 🎯 USE CASES
│   ├── use-cases/
│   │   ├── {verb-noun}/       # Un caso de uso por carpeta
│   │   │   ├── {VerbNoun}UseCase.ts
│   │   │   ├── {VerbNoun}UseCase.test.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── mappers/               # DTO conversions
│   ├── factories/             # Object creation (si aplica)
│   └── index.ts
│
├── infrastructure/            # 🔌 ADAPTERS
│   ├── http/                  # HTTP adapters
│   │   ├── {feature}.routes.ts
│   │   ├── {feature}.schemas.ts
│   │   └── index.ts
│   ├── repositories/          # Repository implementations
│   │   ├── Kysely{Entity}Repository.ts
│   │   └── index.ts
│   ├── services/              # Service implementations (si aplica)
│   └── index.ts
│
├── config/                    # ⚙️ DEPENDENCY INJECTION
│   ├── {feature}.container.ts
│   └── index.ts
│
└── index.ts                   # 📦 PUBLIC API del feature
```

### Ejemplo Concreto: Feature "Users"

```typescript
// features/users/index.ts - Public API del feature
export * from './domain/index.js'
export * from './application/index.js'
// Infrastructure NO se exporta (encapsulado)

// features/users/config/users.container.ts
export class UsersContainer {
  // Lazy getters para todas las dependencias del feature
  get userRepository(): IUserRepository {
    return new KyselyUserRepository(db)
  }

  get createUserUseCase(): CreateUserUseCase {
    return new CreateUserUseCase({
      userRepository: this.userRepository,
      metricsService: sharedContainer.metricsService
    })
  }

  // ... más use cases
}

// core/container/registry.ts
export const featureRegistry = {
  users: new UsersContainer(),
  teams: new TeamsContainer(),
  auth: new AuthContainer(),
}
```

---

## 🔄 Comparativa Antes/Después

### Antes: Organización por Capas Técnicas

```
src/
├── domain/
│   ├── models/
│   │   ├── user/User.ts
│   │   ├── team/Team.ts
│   │   └── refresh-token/RefreshToken.ts
│   ├── repositories/
│   │   ├── IUserRepository.ts
│   │   ├── ITeamRepository.ts
│   │   └── IRefreshTokenRepository.ts
│   └── services/
│       ├── IPasswordHasher.ts
│       └── IMetricsService.ts
│
├── application/
│   ├── use-cases/
│   │   ├── CreateUserUseCase.ts
│   │   ├── LoginUseCase.ts
│   │   ├── CreateTeamUseCase.ts
│   │   └── ... (15 use cases mezclados)
│   ├── mappers/
│   │   ├── UserMapper.ts
│   │   └── TeamMapper.ts
│   └── factories/
│       └── TokenFactory.ts
│
├── infrastructure/
│   ├── database/
│   │   ├── repositories/
│   │   │   ├── KyselyUserRepository.ts
│   │   │   ├── KyselyTeamRepository.ts
│   │   │   └── KyselyRefreshTokenRepository.ts
│   │   └── migrations/
│   ├── http/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   └── teams.ts
│   │   └── middleware/
│   └── auth/
│       ├── AuthService.ts
│       └── ScryptPasswordHasher.ts
│
└── app.ts
```

**Problemas:**
- ❌ No ves las features del negocio
- ❌ Archivos relacionados están lejos
- ❌ Difícil borrar una feature
- ❌ Merge conflicts frecuentes

### Después: Organización por Features

```
src/
├── features/
│   ├── auth/          ← 🔐 "Autenticación" (SCREAMING!)
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── users/         ← 👥 "Gestión de Usuarios" (SCREAMING!)
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   └── teams/         ← ⚽ "Gestión de Equipos" (SCREAMING!)
│       ├── domain/
│       ├── application/
│       └── infrastructure/
│
├── shared/            ← 🔧 Infraestructura compartida
│   ├── database/
│   ├── monitoring/
│   ├── http/
│   └── logging/
│
└── core/              ← 🎛️ Framework core
    ├── container/
    └── app/
```

**Beneficios:**
- ✅ Features de negocio son obvias
- ✅ Archivos relacionados están juntos
- ✅ Fácil borrar features (`rm -rf features/auth`)
- ✅ Menos merge conflicts (cada equipo trabaja en su feature)

---

## 🗺️ Plan de Migración

### Fase 1: Preparación (Sin breaking changes)

1. **Crear nueva estructura en paralelo**
   ```bash
   mkdir -p src/features/{auth,users,teams}/{domain,application,infrastructure,config}
   mkdir -p src/shared/{database,monitoring,http,logging,config,testing}
   mkdir -p src/core/{container,app}
   ```

2. **Mover `shared` primero** (menos riesgo)
   - `infrastructure/database/` → `shared/database/`
   - `infrastructure/monitoring/` → `shared/monitoring/`
   - `infrastructure/http/middleware/` → `shared/http/middleware/`
   - `infrastructure/logging/` → `shared/logging/`
   - `infrastructure/config/` → `shared/config/`
   - `infrastructure/testing/` → `shared/testing/`

3. **Actualizar imports de `shared`**
   - Usar search & replace global
   - Ejecutar tests después de cada cambio

### Fase 2: Migración por Features (Incremental)

**Para cada feature (auth, users, teams):**

1. **Mover domain**
   ```bash
   # Ejemplo: users
   mv domain/models/user features/users/domain/models/
   mv domain/repositories/IUserRepository.ts features/users/domain/repositories/
   ```

2. **Mover application**
   ```bash
   mv application/use-cases/CreateUserUseCase.ts features/users/application/use-cases/create-user/
   mv application/use-cases/ListUsersUseCase.ts features/users/application/use-cases/list-users/
   # ... etc
   mv application/mappers/UserMapper.ts features/users/application/mappers/
   ```

3. **Mover infrastructure**
   ```bash
   mv infrastructure/database/repositories/KyselyUserRepository.ts features/users/infrastructure/repositories/
   mv infrastructure/http/routes/users.ts features/users/infrastructure/http/users.routes.ts
   mv infrastructure/http/schemas/users.schemas.ts features/users/infrastructure/http/users.schemas.ts
   ```

4. **Crear container del feature**
   ```typescript
   // features/users/config/users.container.ts
   export class UsersContainer {
     // Implementar DI para el feature
   }
   ```

5. **Crear barrel exports**
   ```typescript
   // features/users/index.ts
   export * from './domain/index.js'
   export * from './application/index.js'
   ```

6. **Actualizar imports**
   - De: `@domain/models/user`
   - A: `@features/users/domain/models`

7. **Ejecutar tests**
   ```bash
   pnpm test -- features/users
   ```

### Fase 3: Core Framework

1. **Crear registry de features**
   ```typescript
   // core/container/registry.ts
   export const features = {
     auth: new AuthContainer(),
     users: new UsersContainer(),
     teams: new TeamsContainer(),
   }
   ```

2. **Migrar app.ts**
   ```bash
   mv app.ts core/app/app.ts
   ```

3. **Actualizar index.ts**
   ```typescript
   // index.ts
   import { createApp } from '@core/app'
   import { features } from '@core/container/registry'

   const app = createApp({ features })
   app.listen({ port: 3000 })
   ```

### Fase 4: Limpieza

1. **Borrar carpetas antiguas**
   ```bash
   rm -rf domain/
   rm -rf application/
   rm -rf infrastructure/
   ```

2. **Actualizar path aliases en tsconfig.json**
   ```json
   {
     "paths": {
       "@features/*": ["./src/features/*"],
       "@shared/*": ["./src/shared/*"],
       "@core/*": ["./src/core/*"]
     }
   }
   ```

3. **Actualizar documentación**

### Checklist de Migración

- [ ] Fase 1: Shared infrastructure migrado
- [ ] Tests de shared pasando
- [ ] Fase 2.1: Feature "auth" migrado
- [ ] Tests de auth pasando
- [ ] Fase 2.2: Feature "users" migrado
- [ ] Tests de users pasando
- [ ] Fase 2.3: Feature "teams" migrado
- [ ] Tests de teams pasando
- [ ] Fase 3: Core framework migrado
- [ ] Tests E2E pasando
- [ ] Fase 4: Cleanup completado
- [ ] CI/CD pasando
- [ ] Documentación actualizada

---

## 📐 Convenciones y Reglas

### Naming Conventions

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Feature folder | `kebab-case` | `users`, `auth`, `teams` |
| Use case folder | `kebab-case` (verb-noun) | `create-user`, `list-teams` |
| Use case class | `PascalCase` + `UseCase` | `CreateUserUseCase` |
| Route file | `{feature}.routes.ts` | `users.routes.ts` |
| Schema file | `{feature}.schemas.ts` | `users.schemas.ts` |
| Container file | `{feature}.container.ts` | `users.container.ts` |
| Repository impl | `Kysely{Entity}Repository` | `KyselyUserRepository` |
| Repository interface | `I{Entity}Repository` | `IUserRepository` |

### Import Rules

**✅ PERMITIDO:**
```typescript
// Feature puede importar de shared
import { db } from '@shared/database'
import { IMetricsService } from '@shared/monitoring'

// Feature puede importar de core
import { Container } from '@core/container'

// Feature puede importar su propio código
import { User } from '@features/users/domain/models'
```

**❌ PROHIBIDO:**
```typescript
// Feature NO puede importar de otro feature
import { User } from '@features/users/domain/models' // desde features/teams ❌

// Infrastructure NO puede importar de otro feature
import { Team } from '@features/teams/domain/models' // desde shared/database ❌
```

**Excepción:** Si dos features necesitan compartir algo → moverlo a `shared/`

### Dependency Rules

```
features/    → shared/    ✅
features/    → core/      ✅
shared/      → core/      ✅
core/        → shared/    ❌ (inversión)
feature-a/   → feature-b/ ❌ (acoplamiento)
```

### File Organization Rules

1. **Colocación de tests:** Al lado del código
   ```
   CreateUserUseCase.ts
   CreateUserUseCase.test.ts
   ```

2. **Barrel exports:** Cada carpeta tiene `index.ts`
   ```typescript
   // features/users/domain/index.ts
   export * from './models/index.js'
   export * from './repositories/index.js'
   ```

3. **Use case por carpeta:** Un use case = una carpeta
   ```
   application/use-cases/
     ├── create-user/
     │   ├── CreateUserUseCase.ts
     │   ├── CreateUserUseCase.test.ts
     │   └── index.ts
     └── list-users/
         ├── ListUsersUseCase.ts
         ├── ListUsersUseCase.test.ts
         └── index.ts
   ```

---

## 🎯 Métricas de Éxito

La migración será exitosa cuando:

1. **Screaming Architecture:** Al ver `src/features/`, sabes qué hace el sistema
2. **Autonomía de Features:** Cada feature es auto-contenido
3. **0% Acoplamiento entre Features:** Features no se importan entre sí
4. **Tests pasando:** 100% de tests verdes post-migración
5. **CI/CD verde:** Pipeline completo pasando
6. **Developer Experience:** Nuevos devs entienden el código más rápido

---

## 📚 Referencias

- [Screaming Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Package by Feature, not Layer](https://phauer.com/2020/package-by-feature/)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)

---

## 🚀 Próximos Pasos

1. **Review de este documento** - Validar con el equipo
2. **Crear ADR** (Architecture Decision Record) - Documentar decisión
3. **Spike técnico** - Migrar un feature pequeño (e.g., auth) como prueba
4. **Ejecutar plan de migración** - Feature por feature
5. **Actualizar tooling** - Linters, scaffolding scripts, etc.

---

**Versión:** 1.0
**Fecha:** 2025-12-28
**Autor:** Claude + Ignacio
**Estado:** 📝 Propuesta (Pendiente de aprobación)
