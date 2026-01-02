# 🏗️ PLAN MAESTRO: Migración Web a Screaming Architecture

## 📈 PROGRESO ACTUAL

**Estado:** 🚧 En progreso - FASE 1 completada (37.5% del total)

| Fase | Estado | Descripción |
|------|--------|-------------|
| **FASE 1.1** | ✅ **100%** | Core Structure creado |
| **FASE 1.2** | ✅ **100%** | Shared Infrastructure organizado |
| **FASE 1.3** | ✅ **100%** | Providers globales implementados |
| **FASE 1.4** | ⏳ **0%** | Protected Routing (siguiente) |
| **FASE 2** | ⏳ **0%** | Teams Feature |
| **FASE 3** | ⏳ **0%** | Users Feature |
| **FASE 4** | ⏳ **0%** | Design System expansion |
| **FASE 5** | ⏳ **0%** | Routing feature-based |
| **FASE 6** | ⏳ **0%** | Pages migration & cleanup |
| **FASE 7** | ⏳ **0%** | Testing & Documentation |
| **FASE 8** | ⏳ **0%** | Polish & Optimization |

### ✅ Logros principales:
- ✅ Arquitectura `/core` establecida (App, Router, Providers, Container)
- ✅ Design System iniciado (`/shared/design-system`)
- ✅ Providers globales completos (Auth, Theme, Toast, ErrorBoundary)
- ✅ Hooks renombrados a camelCase (`useLogin.ts`)
- ✅ Biome configurado para naming conventions
- ✅ Migraciones de archivos completadas (`/lib` → `/shared`)
- ✅ 62 tests pasando
- ✅ Build exitoso
- ✅ TypeScript sin errores

---

## 📊 ANÁLISIS COMPARATIVO

### API Structure (✅ Implementada)
```
apps/api/src/
├── core/                     # Bootstrap & DI Container
│   ├── app/                 # Fastify setup
│   └── container/           # Main container
├── features/                # Business Features
│   ├── auth/
│   │   ├── application/    # Use cases, factories, mappers
│   │   ├── domain/         # Models, repositories (interfaces)
│   │   ├── infrastructure/ # Repositories impl, HTTP routes
│   │   └── config/         # Feature container
│   ├── teams/
│   └── users/
└── shared/                  # Cross-cutting concerns
    ├── config/             # Environment validation
    ├── database/           # DB connection, schemas
    ├── http/               # Middleware, schemas
    ├── logging/
    ├── monitoring/
    ├── security/
    └── testing/
```

### Web Structure (🚧 En Migración)

#### ✅ YA IMPLEMENTADO (FASE 1.1, 1.2, 1.3 COMPLETADAS)
```
apps/web/src/
├── core/                   # ✅ Application Bootstrap
│   ├── app/
│   │   ├── App.tsx        # ✅ Root component
│   │   ├── AppRouter.tsx  # ✅ Router setup
│   │   ├── AppProviders.tsx # ✅ All providers composed
│   │   └── QueryProvider.tsx # ✅ React Query
│   └── container/
│       └── container.ts   # ✅ DI Container
├── features/
│   └── auth/              # ✅ Completamente implementado
│       ├── application/   # ✅ LoginUseCase, useLogin hook (camelCase)
│       ├── domain/        # ✅ IAuthRepository interface
│       ├── infrastructure/# ✅ AuthRepository (HTTP)
│       └── presentation/  # ✅ LoginForm component
├── shared/
│   ├── constants/         # ✅ Routes constants
│   │   └── routes.ts
│   ├── design-system/     # ✅ UI Components
│   │   ├── components/ui/button/
│   │   └── index.ts
│   ├── infrastructure/
│   │   └── http/          # ✅ HTTP client
│   ├── providers/         # ✅ Global providers
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ToastProvider.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   └── utils/             # ✅ Utilities (cn)
│       ├── cn.ts
│       └── index.ts
└── pages/                 # ⚠️ LEGACY - Pendiente migrar en FASE 6
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── TeamsPage.tsx
    ├── UsersPage.tsx
    └── NotFoundPage.tsx
```

#### ❌ PENDIENTE DE IMPLEMENTAR
```
- FASE 1.4: Protected Routing (ProtectedRoute, PublicRoute)
- FASE 2: Teams Feature (domain, application, infrastructure, presentation)
- FASE 3: Users Feature (domain, application, infrastructure, presentation)
- FASE 4: Design System expansion (Shadcn/Tailwind components)
- FASE 5: Routing feature-based
- FASE 6: Pages migration & cleanup
```

---

## 🎯 OBJETIVO FINAL

### Estructura Target para Web
```
apps/web/src/
├── core/                          # ✨ NEW - Application Bootstrap (Composition Root)
│   ├── app/
│   │   └── App.tsx               # Root component (setup providers + router)
│   └── container/
│       └── container.ts          # Main DI Container (orchestrates all features)
│
├── features/                      # Business Features (Screaming Architecture)
│   ├── auth/                     # ✅ DONE
│   │   ├── application/
│   │   │   ├── hooks/           # React hooks (adapters to use cases)
│   │   │   │   └── useLogin.ts
│   │   │   └── use-cases/       # Business logic orchestration
│   │   │       └── login/
│   │   │           └── LoginUseCase.ts
│   │   ├── domain/
│   │   │   └── repositories/    # Repository interfaces (ports)
│   │   │       └── auth/
│   │   │           └── IAuthRepository.ts
│   │   ├── infrastructure/
│   │   │   └── repositories/    # HTTP repository implementations (adapters)
│   │   │       └── auth/
│   │   │           └── AuthRepository.ts
│   │   ├── presentation/
│   │   │   ├── components/      # Feature-specific UI components
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── pages/           # Feature pages
│   │   │   │   └── LoginPage.tsx
│   │   │   └── routes.tsx       # Feature routes definition
│   │   ├── config/
│   │   │   └── auth.container.ts # Feature DI container
│   │   └── index.ts             # Public API (exports only domain + application)
│   │
│   ├── teams/                    # 🚧 TO IMPLEMENT
│   │   ├── application/
│   │   │   ├── hooks/
│   │   │   │   ├── useTeams.ts
│   │   │   │   ├── useCreateTeam.ts
│   │   │   │   ├── useUpdateTeam.ts
│   │   │   │   └── useDeleteTeam.ts
│   │   │   ├── mappers/
│   │   │   │   └── team/
│   │   │   │       └── TeamMapper.ts
│   │   │   └── use-cases/
│   │   │       ├── create-team/
│   │   │       │   └── CreateTeamUseCase.ts
│   │   │       ├── get-team/
│   │   │       │   └── GetTeamUseCase.ts
│   │   │       ├── list-teams/
│   │   │       │   └── ListTeamsUseCase.ts
│   │   │       ├── update-team/
│   │   │       │   └── UpdateTeamUseCase.ts
│   │   │       └── delete-team/
│   │   │           └── DeleteTeamUseCase.ts
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   └── team/
│   │   │   │       └── Team.ts
│   │   │   └── repositories/
│   │   │       └── team/
│   │   │           └── ITeamRepository.ts
│   │   ├── infrastructure/
│   │   │   └── repositories/
│   │   │       └── team/
│   │   │           └── HttpTeamRepository.ts
│   │   ├── presentation/
│   │   │   ├── components/
│   │   │   │   ├── TeamCard.tsx
│   │   │   │   ├── TeamsTable.tsx
│   │   │   │   ├── CreateTeamForm.tsx
│   │   │   │   └── TeamDetail.tsx
│   │   │   ├── pages/
│   │   │   │   ├── TeamsPage.tsx
│   │   │   │   └── TeamDetailPage.tsx
│   │   │   └── routes.tsx
│   │   ├── config/
│   │   │   └── teams.container.ts
│   │   ├── index.ts
│   │   └── README.md
│   │
│   └── users/                    # 🚧 TO IMPLEMENT
│       ├── application/
│       │   ├── hooks/
│       │   │   ├── useUsers.ts
│       │   │   ├── useCreateUser.ts
│       │   │   ├── useUpdateUser.ts
│       │   │   └── useDeleteUser.ts
│       │   ├── mappers/
│       │   │   └── user/
│       │   │       └── UserMapper.ts
│       │   └── use-cases/
│       │       ├── create-user/
│       │       ├── get-user/
│       │       ├── list-users/
│       │       ├── update-user/
│       │       └── delete-user/
│       ├── domain/
│       │   ├── models/
│       │   │   └── user/
│       │   │       └── User.ts
│       │   └── repositories/
│       │       └── user/
│       │           └── IUserRepository.ts
│       ├── infrastructure/
│       │   └── repositories/
│       │       └── user/
│       │           └── HttpUserRepository.ts
│       ├── presentation/
│       │   ├── components/
│       │   │   ├── UserCard.tsx
│       │   │   ├── UsersTable.tsx
│       │   │   ├── CreateUserForm.tsx
│       │   │   └── UserDetail.tsx
│       │   ├── pages/
│       │   │   ├── UsersPage.tsx
│       │   │   └── UserDetailPage.tsx
│       │   └── routes.tsx
│       ├── config/
│       │   └── users.container.ts
│       ├── index.ts
│       └── README.md
│
├── shared/                       # Cross-cutting concerns
│   ├── config/
│   │   └── environment/         # Environment config (if needed)
│   ├── design-system/           # ✨ NEW - UI Component Library
│   │   ├── components/
│   │   │   └── ui/             # Atomic UI components (Shadcn)
│   │   │       ├── button/
│   │   │       ├── input/
│   │   │       ├── select/
│   │   │       ├── card/
│   │   │       ├── modal/
│   │   │       ├── toast/
│   │   │       ├── table/
│   │   │       └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── MainLayout/
│   │   │   ├── Sidebar/
│   │   │   ├── TopBar/
│   │   │   └── PageHeader/
│   │   └── tokens/             # Design tokens
│   │       └── tailwind.config.js
│   ├── infrastructure/
│   │   ├── http/               # ✅ Already exists - HTTP client
│   │   │   ├── FetchHttpClient.ts
│   │   │   ├── IHttpClient.ts
│   │   │   ├── error-mapper.ts
│   │   │   └── retry-utils.ts
│   │   └── routing/            # ✨ NEW - Routing utilities
│   │       └── ProtectedRoute.tsx
│   ├── providers/              # ✨ NEW - Global React providers
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── ToastProvider.tsx
│   │   └── ErrorBoundary.tsx
│   ├── types/                  # Shared TypeScript types
│   │   └── Result.ts
│   └── utils/                  # ✅ Already exists - Utilities
│       └── cn.ts
│
├── app/                         # ⚠️ TO DEPRECATE - Content moves to /core and features
│   ├── App.tsx                 # → MOVE TO /core/app/App.tsx
│   ├── router/
│   │   └── AppRouter.tsx       # → MOVE TO /core/app/AppRouter.tsx
│   └── providers/
│       └── AppProviders.tsx    # → MOVE TO /core/app/AppProviders.tsx
│
├── pages/                       # ❌ DELETE - Move to features/*/presentation/pages
│   └── (all files to be moved)
│
├── components/                  # ⚠️ REORGANIZE
│   └── ui/
│       └── button.tsx          # → MOVE TO /shared/design-system/components/ui/button/
│
└── lib/                         # ⚠️ KEEP - Utilities & constants
    ├── constants/
    │   └── routes.ts           # Keep or move to features
    └── utils.ts                # → MOVE TO /shared/utils/
```

---

## 🎯 DECISIÓN: `/core` vs `/app`

### Por qué `/core` es mejor:

| Aspecto | `/core` | `/app` |
|---------|---------|--------|
| **Propósito explícito** | ✅ Composition Root (DI + Bootstrap) | ❌ Ambiguo (¿app code o setup?) |
| **Consistencia con API** | ✅ Mismo patrón que backend | ❌ Diferente estructura |
| **Separación de concerns** | ✅ Setup vs Features vs Shared | ❌ Mezcla setup con routes |
| **Escalabilidad** | ✅ Fácil extraer features | ❌ Acoplado a React |
| **Claridad** | ✅ "Core = arranque de app" | ❌ "App = todo o nada" |

### Qué va en `/core`:
- **`core/app/`**: Root component, providers setup, router setup
- **`core/container/`**: Main DI container (orchestrates ALL features)

### Qué NO va en `/core`:
- ❌ Features (van en `/features`)
- ❌ UI components (van en `/shared/design-system`)
- ❌ Business logic (va en features)
- ❌ Routes definitions (van en features `*/presentation/routes.tsx`)

---

## 📋 PLAN DE EJECUCIÓN (MODO DIOS)

### ✅ FASE 1: Preparación y Fundamentos (COMPLETADA)
**Objetivo:** Establecer la infraestructura base para la nueva arquitectura

#### ✅ 1.1 Crear Core Structure (COMPLETADO)
- [x] Crear `/src/core/app/`
- [x] Crear `/src/core/container/`
- [x] Mover `/app/App.tsx` → `/core/app/App.tsx`
- [x] Mover `/app/router/AppRouter.tsx` → `/core/app/AppRouter.tsx`
- [x] Mover `/app/providers/AppProviders.tsx` → `/core/app/AppProviders.tsx`
- [x] Mover `/shared/infrastructure/di/container.ts` → `/core/container/container.ts`
- [x] Actualizar imports en `main.tsx`
- [x] Actualizar imports en archivos (useLogin, container)
- [x] Renombrar hooks: `use-login.ts` → `useLogin.ts` (camelCase)
- [x] Configurar Biome para permitir camelCase en `/hooks/use*.ts`

#### ✅ 1.2 Expandir Shared Infrastructure (COMPLETADO)
- [x] Crear `/src/shared/design-system/` structure
  - [x] `components/ui/`
  - [x] `layout/`
  - [x] `tokens/`
- [x] Tailwind CSS ya estaba instalado (v4.x)
- [x] Mover `/components/ui/button/` → `/shared/design-system/components/ui/button/`
- [x] Mover `/lib/utils.ts` → `/shared/utils/cn.ts`
- [x] Mover `/lib/constants/routes.ts` → `/shared/constants/routes.ts`
- [x] Crear barrel exports para design-system y utils
- [x] Actualizar imports (LoginForm, AppRouter, NotFoundPage)
- [x] Eliminar carpetas legacy (`/lib`, `/components`)

#### ✅ 1.3 Setup Providers (COMPLETADO)
- [x] Crear `/src/shared/providers/`
- [x] Implementar `AuthProvider.tsx`
  - [x] Hook `useAuth()` con `login()`, `logout()`, `isAuthenticated`, `user`
  - [x] Context para estado de autenticación global
- [x] Implementar `ThemeProvider.tsx`
  - [x] Hook `useTheme()` con `theme`, `setTheme()`
  - [x] Soporte light/dark/system
  - [x] Persistencia en localStorage
- [x] Implementar `ToastProvider.tsx`
  - [x] Hook `useToast()` con `showToast()`
  - [x] Tipos: success, error, info, warning
  - [x] Auto-dismiss después de 5s
- [x] Implementar `ErrorBoundary.tsx`
  - [x] Class component para captura de errores
  - [x] UI de fallback con reload button
  - [x] Detalles de error en dev mode
- [x] Crear barrel export `/shared/providers/index.ts`
- [x] Actualizar `/core/app/AppProviders.tsx` con jerarquía correcta:
  - [x] ErrorBoundary → ThemeProvider → ToastProvider → QueryProvider → AuthProvider

#### ⏳ 1.4 Protected Routing (PENDIENTE)
- [ ] Crear `/shared/infrastructure/routing/`
- [ ] Implementar `ProtectedRoute.tsx`
  ```typescript
  // Requires authentication
  export function ProtectedRoute({ children }: { children: React.ReactNode })
  ```
- [ ] Implementar `PublicRoute.tsx`
  ```typescript
  // Redirects if already authenticated
  export function PublicRoute({ children }: { children: React.ReactNode })
  ```
- [ ] Actualizar `AppRouter.tsx` para usar route guards

---

### FASE 2: Feature Teams - Full Implementation (Día 3-5)
**Objetivo:** Implementar completamente el feature Teams siguiendo el patrón de Auth

#### 2.1 Teams Domain Layer
- [ ] Crear estructura de carpetas
  ```bash
  mkdir -p src/features/teams/domain/{models/team,repositories/team}
  ```
- [ ] Crear `Team.ts` entity
  ```typescript
  // features/teams/domain/models/team/Team.ts
  export class Team {
    constructor(
      public readonly id: string,
      public readonly name: string,
      public readonly description: string | null,
      public readonly createdAt: Date,
      public readonly updatedAt: Date,
    ) {}

    // Domain validations
    isValid(): boolean {
      return this.name.trim().length > 0
    }

    canBeDeleted(): boolean {
      // Business rule: can always be deleted (override if needed)
      return true
    }
  }
  ```
- [ ] Crear `ITeamRepository.ts` interface
  ```typescript
  // features/teams/domain/repositories/team/ITeamRepository.ts
  import type { Result } from '@/shared/types/Result'
  import type { Team } from '../../models/team/Team'

  export interface CreateTeamDto {
    name: string
    description?: string
  }

  export interface UpdateTeamDto {
    name?: string
    description?: string
  }

  export interface ITeamRepository {
    create(dto: CreateTeamDto): Promise<Result<Team>>
    getById(id: string): Promise<Result<Team>>
    list(): Promise<Result<Team[]>>
    update(id: string, dto: UpdateTeamDto): Promise<Result<Team>>
    delete(id: string): Promise<Result<void>>
  }
  ```
- [ ] Crear barrel exports `domain/index.ts`

#### 2.2 Teams Application Layer
- [ ] Crear estructura de carpetas
  ```bash
  mkdir -p src/features/teams/application/{hooks,mappers/team,use-cases/{create-team,get-team,list-teams,update-team,delete-team}}
  ```
- [ ] Crear `TeamMapper.ts`
  ```typescript
  // Map API responses to domain models
  export class TeamMapper {
    static toDomain(dto: TeamDto): Team {
      return new Team(dto.id, dto.name, dto.description, new Date(dto.createdAt), new Date(dto.updatedAt))
    }
  }
  ```
- [ ] Crear Use Cases:
  - [ ] `CreateTeamUseCase.ts`
    ```typescript
    export class CreateTeamUseCase {
      constructor(private readonly teamRepository: ITeamRepository) {}

      async execute(dto: CreateTeamDto): Promise<Result<Team>> {
        // Validation
        if (!dto.name?.trim()) {
          return Result.err(new Error('Team name is required'))
        }

        // Delegate to repository
        return this.teamRepository.create(dto)
      }
    }
    ```
  - [ ] `GetTeamUseCase.ts`
  - [ ] `ListTeamsUseCase.ts`
  - [ ] `UpdateTeamUseCase.ts`
  - [ ] `DeleteTeamUseCase.ts`
- [ ] Crear React Hooks (adapters):
  - [ ] `useTeams.ts`
    ```typescript
    import { useQuery } from '@tanstack/react-query'
    import { container } from '@/core/container/container'

    export function useTeams() {
      const listTeamsUseCase = container.teams.listTeamsUseCase

      return useQuery({
        queryKey: ['teams'],
        queryFn: async () => {
          const result = await listTeamsUseCase.execute()
          if (result.isErr()) throw result.error
          return result.value
        }
      })
    }
    ```
  - [ ] `useCreateTeam.ts` (useMutation)
  - [ ] `useUpdateTeam.ts` (useMutation)
  - [ ] `useDeleteTeam.ts` (useMutation)
- [ ] Crear barrel exports `application/index.ts`

#### 2.3 Teams Infrastructure Layer
- [ ] Crear estructura de carpetas
  ```bash
  mkdir -p src/features/teams/infrastructure/repositories/team
  ```
- [ ] Crear `HttpTeamRepository.ts`
  ```typescript
  import type { IHttpClient } from '@/shared/infrastructure/http/IHttpClient'
  import type { ITeamRepository } from '../../../domain/repositories/team/ITeamRepository'
  import { TeamMapper } from '../../../application/mappers/team/TeamMapper'

  export class HttpTeamRepository implements ITeamRepository {
    constructor(private readonly httpClient: IHttpClient) {}

    async create(dto: CreateTeamDto): Promise<Result<Team>> {
      const response = await this.httpClient.post<TeamDto>('/teams', dto)
      if (response.isErr()) return Result.err(response.error)
      return Result.ok(TeamMapper.toDomain(response.value))
    }

    async getById(id: string): Promise<Result<Team>> {
      const response = await this.httpClient.get<TeamDto>(`/teams/${id}`)
      if (response.isErr()) return Result.err(response.error)
      return Result.ok(TeamMapper.toDomain(response.value))
    }

    async list(): Promise<Result<Team[]>> {
      const response = await this.httpClient.get<TeamDto[]>('/teams')
      if (response.isErr()) return Result.err(response.error)
      return Result.ok(response.value.map(TeamMapper.toDomain))
    }

    async update(id: string, dto: UpdateTeamDto): Promise<Result<Team>> {
      const response = await this.httpClient.put<TeamDto>(`/teams/${id}`, dto)
      if (response.isErr()) return Result.err(response.error)
      return Result.ok(TeamMapper.toDomain(response.value))
    }

    async delete(id: string): Promise<Result<void>> {
      return this.httpClient.delete(`/teams/${id}`)
    }
  }
  ```

#### 2.4 Teams Presentation Layer
- [ ] Crear estructura de carpetas
  ```bash
  mkdir -p src/features/teams/presentation/{components,pages}
  ```
- [ ] Crear componentes UI:
  - [ ] `TeamCard.tsx` (mostrar team individual en card)
  - [ ] `TeamsTable.tsx` (tabla con todos los teams)
  - [ ] `CreateTeamForm.tsx` (formulario para crear)
  - [ ] `EditTeamForm.tsx` (formulario para editar)
  - [ ] `TeamDetail.tsx` (vista detallada de un team)
- [ ] Crear páginas:
  - [ ] `TeamsPage.tsx`
    ```typescript
    import { useTeams } from '../../application/hooks/useTeams'
    import { TeamsTable } from '../components/TeamsTable'

    export function TeamsPage() {
      const { data: teams, isLoading } = useTeams()

      if (isLoading) return <div>Loading...</div>

      return (
        <div>
          <h1>Teams</h1>
          <TeamsTable teams={teams ?? []} />
        </div>
      )
    }
    ```
  - [ ] `TeamDetailPage.tsx`
- [ ] Crear `routes.tsx`
  ```typescript
  import { lazy } from 'react'

  const TeamsPage = lazy(() => import('./pages/TeamsPage'))
  const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage'))

  export const teamsRoutes = [
    {
      path: '/teams',
      element: <TeamsPage />
    },
    {
      path: '/teams/:id',
      element: <TeamDetailPage />
    }
  ]
  ```

#### 2.5 Teams Config (DI)
- [ ] Crear `teams.container.ts`
  ```typescript
  import type { IHttpClient } from '@/shared/infrastructure/http/IHttpClient'
  import type { ITeamRepository } from '../domain/repositories/team/ITeamRepository'
  import { HttpTeamRepository } from '../infrastructure/repositories/team/HttpTeamRepository'
  import { CreateTeamUseCase } from '../application/use-cases/create-team/CreateTeamUseCase'
  import { ListTeamsUseCase } from '../application/use-cases/list-teams/ListTeamsUseCase'
  // ... other use cases

  export class TeamsContainer {
    constructor(private readonly httpClient: IHttpClient) {}

    // Repository
    private _teamRepository?: ITeamRepository
    get teamRepository(): ITeamRepository {
      if (!this._teamRepository) {
        this._teamRepository = new HttpTeamRepository(this.httpClient)
      }
      return this._teamRepository
    }

    // Use Cases
    private _createTeamUseCase?: CreateTeamUseCase
    get createTeamUseCase(): CreateTeamUseCase {
      if (!this._createTeamUseCase) {
        this._createTeamUseCase = new CreateTeamUseCase(this.teamRepository)
      }
      return this._createTeamUseCase
    }

    private _listTeamsUseCase?: ListTeamsUseCase
    get listTeamsUseCase(): ListTeamsUseCase {
      if (!this._listTeamsUseCase) {
        this._listTeamsUseCase = new ListTeamsUseCase(this.teamRepository)
      }
      return this._listTeamsUseCase
    }

    // ... other use cases
  }
  ```
- [ ] Actualizar `/core/container/container.ts`
  ```typescript
  import { TeamsContainer } from '@/features/teams/config/teams.container'

  export class Container {
    // ... existing code

    private _teamsContainer?: TeamsContainer
    get teams(): TeamsContainer {
      if (!this._teamsContainer) {
        this._teamsContainer = new TeamsContainer(this.httpClient)
      }
      return this._teamsContainer
    }
  }
  ```
- [ ] Crear barrel export `features/teams/index.ts`
  ```typescript
  // Export only domain + application (NOT infrastructure/presentation)
  export * from './domain/index.js'
  export * from './application/index.js'
  ```

#### 2.6 Teams Testing
- [ ] Unit tests para `Team` entity
- [ ] Unit tests para cada use case
- [ ] Integration test para `HttpTeamRepository`
- [ ] Component tests para cada componente de presentación

#### 2.7 Teams Documentation
- [ ] Crear `features/teams/README.md`
  ```markdown
  # Teams Feature

  ## Overview
  Manages team entities in the application.

  ## Architecture
  - **Domain**: Team entity, ITeamRepository interface
  - **Application**: CRUD use cases, React hooks
  - **Infrastructure**: HttpTeamRepository (API adapter)
  - **Presentation**: UI components, pages, routes

  ## Usage
  ```typescript
  import { useTeams } from '@/features/teams'

  function MyComponent() {
    const { data: teams } = useTeams()
    return <div>{teams.map(t => t.name)}</div>
  }
  ```
  ```

---

### FASE 3: Feature Users - Full Implementation (Día 6-8)
**Objetivo:** Replicar exactamente la estructura de Teams para Users

**NOTA:** Seguir EXACTAMENTE los mismos pasos que en FASE 2, pero para Users.

#### 3.1 Users Domain Layer
- [ ] Crear `User.ts` entity
- [ ] Crear `IUserRepository.ts` interface
- [ ] Crear value objects si necesario (Email, Role, etc.)

#### 3.2 Users Application Layer
- [ ] Crear `UserMapper.ts`
- [ ] Crear Use Cases: Create, Get, List, Update, Delete
- [ ] Crear React Hooks: useUsers, useCreateUser, useUpdateUser, useDeleteUser

#### 3.3 Users Infrastructure Layer
- [ ] Crear `HttpUserRepository.ts`

#### 3.4 Users Presentation Layer
- [ ] Crear componentes: UserCard, UsersTable, CreateUserForm, EditUserForm, UserDetail
- [ ] Crear páginas: UsersPage, UserDetailPage
- [ ] Crear routes.tsx

#### 3.5 Users Config (DI)
- [ ] Crear `users.container.ts`
- [ ] Actualizar `/core/container/container.ts`
- [ ] Crear barrel export `features/users/index.ts`

#### 3.6 Users Testing
- [ ] Unit tests domain
- [ ] Unit tests use cases
- [ ] Integration tests repository
- [ ] Component tests

#### 3.7 Users Documentation
- [ ] Crear `features/users/README.md`

---

### FASE 4: Design System Expansion (Día 9-11)
**Objetivo:** Crear un sistema de diseño robusto usando Shadcn/ui

#### 4.1 Install & Configure Shadcn
- [ ] Instalar Shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Configurar `components.json`
- [ ] Configurar design tokens en `tailwind.config.js`
  ```javascript
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { ... },
        secondary: { ... },
        // ... more tokens
      }
    }
  }
  ```

#### 4.2 Core UI Components (Shadcn)
Instalar componentes base:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add switch
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
```

- [ ] Organizar en `/shared/design-system/components/ui/`
- [ ] Crear index.ts para exports

#### 4.3 Compound Components
```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tooltip
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion
```

#### 4.4 Layout Components
- [ ] Crear `MainLayout.tsx`
  ```typescript
  export function MainLayout({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    )
  }
  ```
- [ ] Crear `Sidebar.tsx`
- [ ] Crear `TopBar.tsx`
- [ ] Crear `PageHeader.tsx`
- [ ] Crear `Breadcrumbs.tsx`

#### 4.5 Storybook Setup
- [ ] Instalar Storybook
  ```bash
  npx storybook@latest init
  ```
- [ ] Configurar Storybook con Tailwind
- [ ] Crear stories para todos los componentes UI
- [ ] Crear stories para layout components
- [ ] Documentar props y variantes

---

### FASE 5: Routing & Navigation (Día 12-13)
**Objetivo:** Implementar routing feature-based con protección

#### 5.1 Feature-based Routing
- [ ] Mover `LoginPage` a `/features/auth/presentation/pages/LoginPage.tsx`
- [ ] Crear `/features/auth/presentation/routes.tsx`
  ```typescript
  export const authRoutes = [
    {
      path: '/login',
      element: <PublicRoute><LoginPage /></PublicRoute>
    }
  ]
  ```
- [ ] Teams routes ya creados en FASE 2
- [ ] Users routes ya creados en FASE 3

#### 5.2 AppRouter Composition
- [ ] Actualizar `/core/app/AppRouter.tsx`
  ```typescript
  import { createBrowserRouter, RouterProvider } from 'react-router-dom'
  import { authRoutes } from '@/features/auth/presentation/routes'
  import { teamsRoutes } from '@/features/teams/presentation/routes'
  import { usersRoutes } from '@/features/users/presentation/routes'
  import { ProtectedRoute } from '@/shared/infrastructure/routing/ProtectedRoute'
  import { MainLayout } from '@/shared/design-system/layout/MainLayout'

  const router = createBrowserRouter([
    ...authRoutes, // Public routes
    {
      path: '/',
      element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
      children: [
        { path: 'dashboard', element: <DashboardPage /> },
        ...teamsRoutes,
        ...usersRoutes,
      ]
    },
    { path: '*', element: <NotFoundPage /> }
  ])

  export function AppRouter() {
    return <RouterProvider router={router} />
  }
  ```

#### 5.3 Route Guards Implementation
- [ ] `ProtectedRoute.tsx`
  ```typescript
  import { Navigate } from 'react-router-dom'
  import { useAuth } from '@/shared/providers/AuthProvider'

  export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    return <>{children}</>
  }
  ```
- [ ] `PublicRoute.tsx`
  ```typescript
  export function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()

    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />
    }

    return <>{children}</>
  }
  ```

#### 5.4 Navigation Components
- [ ] Crear `NavLinks.tsx` (sidebar navigation)
- [ ] Integrar con `Sidebar.tsx`
- [ ] Active route highlighting
- [ ] Breadcrumbs basados en route

---

### FASE 6: Pages Migration & Cleanup (Día 14)
**Objetivo:** Eliminar carpeta pages y mover todo a features

#### 6.1 Migrate Pages
- [x] `LoginPage.tsx` → Ya movido en FASE 5
- [x] `TeamsPage.tsx` → Ya movido en FASE 2
- [x] `UsersPage.tsx` → Ya movido en FASE 3
- [ ] `DashboardPage.tsx` → `/shared/pages/DashboardPage.tsx` o feature propio
- [ ] `NotFoundPage.tsx` → `/shared/pages/NotFoundPage.tsx`

#### 6.2 Update Imports
- [ ] Buscar imports de `/pages/` en todo el proyecto
  ```bash
  grep -r "from.*pages/" src/
  ```
- [ ] Actualizar a nuevas rutas
- [ ] Verificar compilación sin errores

#### 6.3 Delete Legacy Folders
- [ ] Verificar que `/src/pages/` está vacío
- [ ] Eliminar `/src/pages/`
- [ ] Eliminar `/src/app/` (ya migrado a `/core`)
- [ ] Eliminar `/src/components/common/` (vacío)
- [ ] Eliminar `/src/components/layout/` (vacío)
- [ ] Mover `/src/components/ui/` → `/shared/design-system/components/ui/`
- [ ] Eliminar `/src/components/`

#### 6.4 Migrate Lib
- [ ] Mover `/lib/utils.ts` → `/shared/utils/cn.ts` (si no existe ya)
- [ ] Evaluar `/lib/constants/routes.ts`
  - Opción A: Mantener centralizado
  - Opción B: Mover a features
- [ ] Actualizar imports

---

### FASE 7: Testing & Documentation (Día 15-16)
**Objetivo:** Asegurar calidad y documentación

#### 7.1 Testing Coverage
- [ ] Unit tests para todos los domain entities
  - [ ] Team.test.ts
  - [ ] User.test.ts
- [ ] Unit tests para todos los use cases
  - [ ] CreateTeamUseCase.test.ts
  - [ ] ListTeamsUseCase.test.ts
  - [ ] CreateUserUseCase.test.ts
  - [ ] etc.
- [ ] Integration tests para repositories
  - [ ] HttpTeamRepository.test.ts
  - [ ] HttpUserRepository.test.ts
- [ ] Component tests
  - [ ] TeamCard.test.tsx
  - [ ] TeamsTable.test.tsx
  - [ ] UserCard.test.tsx
  - [ ] etc.
- [ ] E2E tests (Playwright/Cypress)
  - [ ] Login flow
  - [ ] Create team flow
  - [ ] Create user flow
- [ ] Alcanzar targets:
  - [ ] Domain: 90%+ coverage
  - [ ] Application: 80%+ coverage
  - [ ] Infrastructure: 70%+ coverage
  - [ ] Presentation: 60%+ coverage

#### 7.2 Documentation
- [ ] Actualizar `/README.md` principal
  ```markdown
  # TeamPulse Web

  ## Architecture
  This project follows Screaming Architecture principles.

  ### Structure
  - `/core` - Application bootstrap
  - `/features` - Business features (auth, teams, users)
  - `/shared` - Cross-cutting concerns

  ### Adding a new feature
  [Instructions...]
  ```
- [ ] Crear `/docs/ARCHITECTURE.md`
- [ ] Crear ADR-002: Web Screaming Architecture Migration
  ```markdown
  # ADR-002: Web Application Screaming Architecture

  ## Status
  Accepted

  ## Context
  [Explain why we migrated to screaming architecture]

  ## Decision
  [What we decided]

  ## Consequences
  [What this means]
  ```
- [ ] Completar `/features/auth/README.md`
- [ ] Completar `/features/teams/README.md`
- [ ] Completar `/features/users/README.md`
- [ ] Documentar Design System en Storybook

#### 7.3 Code Review Checklist
- [ ] ✅ Naming conventions consistentes
- [ ] ✅ No código duplicado
- [ ] ✅ Barrel exports correctos en features
- [ ] ✅ No imports directos entre features
- [ ] ✅ DI container completamente implementado
- [ ] ✅ Error handling consistente
- [ ] ✅ Loading states en todas las queries
- [ ] ✅ Accessibility (ARIA, keyboard nav)
- [ ] ✅ Responsive design

---

### FASE 8: Polish & Optimization (Día 17)
**Objetivo:** Optimización final y pulido

#### 8.1 Performance Optimization
- [ ] Lazy loading de features
  ```typescript
  const TeamsPage = lazy(() => import('@/features/teams/presentation/pages/TeamsPage'))
  ```
- [ ] Code splitting por route
- [ ] Bundle size analysis
  ```bash
  npm run build
  npm install -D rollup-plugin-visualizer
  ```
- [ ] Optimize images (WebP, lazy loading)
- [ ] Memoization donde sea necesario (React.memo, useMemo, useCallback)
- [ ] Lighthouse audit (target: 90+ en todas las métricas)

#### 8.2 Error Handling
- [ ] Error boundary por feature
  ```typescript
  <ErrorBoundary fallback={<FeatureErrorFallback />}>
    <TeamsPage />
  </ErrorBoundary>
  ```
- [ ] Toast notifications para errores
- [ ] Error logging (Sentry/LogRocket)
- [ ] User-friendly error messages
- [ ] Retry mechanisms en queries

#### 8.3 Accessibility (A11y)
- [ ] ARIA labels en todos los componentes interactivos
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus management
- [ ] Screen reader testing
- [ ] Color contrast WCAG AA compliance
- [ ] Alt text en imágenes

#### 8.4 Final Polish
- [ ] Dark mode implementation
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Success messages
- [ ] Confirmation dialogs para acciones destructivas
- [ ] Form validations user-friendly
- [ ] Animations/transitions suaves

---

## 🎨 PATRONES Y ESTÁNDARES

### 1. Component Structure
```typescript
// features/teams/presentation/components/TeamCard.tsx
import { Card } from '@/shared/design-system/components/ui/card'
import { useTeam } from '../../application/hooks/useTeam'

interface TeamCardProps {
  teamId: string
}

export function TeamCard({ teamId }: TeamCardProps) {
  const { team, isLoading, error } = useTeam(teamId)

  if (isLoading) return <Skeleton className="h-32" />
  if (error) return <ErrorState error={error} />
  if (!team) return <EmptyState message="Team not found" />

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold">{team.name}</h3>
      {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
    </Card>
  )
}
```

### 2. Hook Structure (Application Layer Adapter)
```typescript
// features/teams/application/hooks/useTeams.ts
import { useQuery } from '@tanstack/react-query'
import { container } from '@/core/container/container'

export function useTeams() {
  const listTeamsUseCase = container.teams.listTeamsUseCase

  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const result = await listTeamsUseCase.execute()
      if (result.isErr()) throw result.error
      return result.value
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateTeam() {
  const createTeamUseCase = container.teams.createTeamUseCase
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: CreateTeamDto) => {
      const result = await createTeamUseCase.execute(dto)
      if (result.isErr()) throw result.error
      return result.value
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    }
  })
}
```

### 3. Use Case Structure
```typescript
// features/teams/application/use-cases/create-team/CreateTeamUseCase.ts
import { Result } from '@/shared/types/Result'
import type { ITeamRepository, CreateTeamDto } from '../../../domain/repositories/team/ITeamRepository'
import type { Team } from '../../../domain/models/team/Team'

export class CreateTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  async execute(dto: CreateTeamDto): Promise<Result<Team>> {
    // Domain validation
    if (!dto.name || dto.name.trim().length === 0) {
      return Result.err(new Error('Team name is required'))
    }

    if (dto.name.length > 100) {
      return Result.err(new Error('Team name is too long (max 100 characters)'))
    }

    // Delegate to repository
    return this.teamRepository.create(dto)
  }
}
```

### 4. Repository Implementation
```typescript
// features/teams/infrastructure/repositories/team/HttpTeamRepository.ts
import type { IHttpClient } from '@/shared/infrastructure/http/IHttpClient'
import type { ITeamRepository, CreateTeamDto, UpdateTeamDto } from '../../../domain/repositories/team/ITeamRepository'
import type { Team } from '../../../domain/models/team/Team'
import { TeamMapper } from '../../../application/mappers/team/TeamMapper'
import { Result } from '@/shared/types/Result'

interface TeamDto {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export class HttpTeamRepository implements ITeamRepository {
  constructor(private readonly httpClient: IHttpClient) {}

  async create(dto: CreateTeamDto): Promise<Result<Team>> {
    const response = await this.httpClient.post<TeamDto>('/teams', dto)
    if (response.isErr()) return Result.err(response.error)
    return Result.ok(TeamMapper.toDomain(response.value))
  }

  async getById(id: string): Promise<Result<Team>> {
    const response = await this.httpClient.get<TeamDto>(`/teams/${id}`)
    if (response.isErr()) return Result.err(response.error)
    return Result.ok(TeamMapper.toDomain(response.value))
  }

  async list(): Promise<Result<Team[]>> {
    const response = await this.httpClient.get<TeamDto[]>('/teams')
    if (response.isErr()) return Result.err(response.error)
    return Result.ok(response.value.map(TeamMapper.toDomain))
  }

  async update(id: string, dto: UpdateTeamDto): Promise<Result<Team>> {
    const response = await this.httpClient.put<TeamDto>(`/teams/${id}`, dto)
    if (response.isErr()) return Result.err(response.error)
    return Result.ok(TeamMapper.toDomain(response.value))
  }

  async delete(id: string): Promise<Result<void>> {
    return this.httpClient.delete(`/teams/${id}`)
  }
}
```

### 5. Container Pattern
```typescript
// features/teams/config/teams.container.ts
import type { IHttpClient } from '@/shared/infrastructure/http/IHttpClient'
import type { ITeamRepository } from '../domain/repositories/team/ITeamRepository'
import { HttpTeamRepository } from '../infrastructure/repositories/team/HttpTeamRepository'
import { CreateTeamUseCase } from '../application/use-cases/create-team/CreateTeamUseCase'
import { ListTeamsUseCase } from '../application/use-cases/list-teams/ListTeamsUseCase'
import { GetTeamUseCase } from '../application/use-cases/get-team/GetTeamUseCase'
import { UpdateTeamUseCase } from '../application/use-cases/update-team/UpdateTeamUseCase'
import { DeleteTeamUseCase } from '../application/use-cases/delete-team/DeleteTeamUseCase'

export class TeamsContainer {
  constructor(private readonly httpClient: IHttpClient) {}

  // Repository (singleton)
  private _teamRepository?: ITeamRepository
  get teamRepository(): ITeamRepository {
    if (!this._teamRepository) {
      this._teamRepository = new HttpTeamRepository(this.httpClient)
    }
    return this._teamRepository
  }

  // Use Cases (singletons)
  private _createTeamUseCase?: CreateTeamUseCase
  get createTeamUseCase(): CreateTeamUseCase {
    if (!this._createTeamUseCase) {
      this._createTeamUseCase = new CreateTeamUseCase(this.teamRepository)
    }
    return this._createTeamUseCase
  }

  private _listTeamsUseCase?: ListTeamsUseCase
  get listTeamsUseCase(): ListTeamsUseCase {
    if (!this._listTeamsUseCase) {
      this._listTeamsUseCase = new ListTeamsUseCase(this.teamRepository)
    }
    return this._listTeamsUseCase
  }

  private _getTeamUseCase?: GetTeamUseCase
  get getTeamUseCase(): GetTeamUseCase {
    if (!this._getTeamUseCase) {
      this._getTeamUseCase = new GetTeamUseCase(this.teamRepository)
    }
    return this._getTeamUseCase
  }

  private _updateTeamUseCase?: UpdateTeamUseCase
  get updateTeamUseCase(): UpdateTeamUseCase {
    if (!this._updateTeamUseCase) {
      this._updateTeamUseCase = new UpdateTeamUseCase(this.teamRepository)
    }
    return this._updateTeamUseCase
  }

  private _deleteTeamUseCase?: DeleteTeamUseCase
  get deleteTeamUseCase(): DeleteTeamUseCase {
    if (!this._deleteTeamUseCase) {
      this._deleteTeamUseCase = new DeleteTeamUseCase(this.teamRepository)
    }
    return this._deleteTeamUseCase
  }
}
```

### 6. Main Container
```typescript
// core/container/container.ts
import { FetchHttpClient } from '@/shared/infrastructure/http/FetchHttpClient'
import type { IHttpClient } from '@/shared/infrastructure/http/IHttpClient'
import { AuthContainer } from '@/features/auth/config/auth.container'
import { TeamsContainer } from '@/features/teams/config/teams.container'
import { UsersContainer } from '@/features/users/config/users.container'

export class Container {
  // Shared infrastructure
  private _httpClient?: IHttpClient
  get httpClient(): IHttpClient {
    if (!this._httpClient) {
      this._httpClient = new FetchHttpClient({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      })
    }
    return this._httpClient
  }

  // Feature containers
  private _authContainer?: AuthContainer
  get auth(): AuthContainer {
    if (!this._authContainer) {
      this._authContainer = new AuthContainer(this.httpClient)
    }
    return this._authContainer
  }

  private _teamsContainer?: TeamsContainer
  get teams(): TeamsContainer {
    if (!this._teamsContainer) {
      this._teamsContainer = new TeamsContainer(this.httpClient)
    }
    return this._teamsContainer
  }

  private _usersContainer?: UsersContainer
  get users(): UsersContainer {
    if (!this._usersContainer) {
      this._usersContainer = new UsersContainer(this.httpClient)
    }
    return this._usersContainer
  }
}

// Singleton instance
export const container = new Container()
```

---

## 🚨 REGLAS DE ORO

### Arquitectura
1. **Never skip layers** - Siempre domain → application → infrastructure → presentation
2. **Domain is pure** - No imports de React, HTTP, o frameworks en domain
3. **Interfaces in domain** - Repositories e interfaces van en domain, implementaciones en infrastructure
4. **DI via containers** - Nunca imports directos de use cases, siempre via container
5. **Barrel exports** - Cada feature exporta solo domain + application en `index.ts`
6. **Feature independence** - Features no deben importarse entre sí directamente
7. **Shared for common** - Solo infraestructura compartida va en `/shared`

### Testing
8. **Tests are mandatory** - No feature sin tests (mínimo 80% coverage en application)
9. **Test all layers** - Unit tests en domain/application, integration en infrastructure

### Documentation
10. **Docs are required** - README.md por feature explicando arquitectura y uso

### Code Quality
11. **TypeScript strict mode** - Sin `any`, usar tipos explícitos
12. **Error handling** - Siempre usar Result type, nunca throw en domain/application
13. **No magic strings** - Constantes para rutas, query keys, etc.

---

## 📦 DEPENDENCIES A INSTALAR

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Shadcn/ui
npx shadcn-ui@latest init

# Forms
npm install react-hook-form @hookform/resolvers zod

# Icons
npm install lucide-react

# Utils
npm install clsx tailwind-merge

# Testing (si no está)
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test  # E2E tests

# Storybook
npx storybook@latest init
```

---

## 📈 MÉTRICAS DE ÉXITO

### Code Quality
- [ ] 0 ESLint errors
- [ ] 0 TypeScript errors
- [ ] 80%+ test coverage global
- [ ] 90%+ coverage en domain layer
- [ ] A+ Lighthouse score (Performance, Accessibility, Best Practices, SEO)

### Architecture
- [ ] 100% features en Screaming Architecture
- [ ] 0 imports directos entre features (solo via barrel exports)
- [ ] DI container completamente implementado
- [ ] Todos los use cases testeados
- [ ] 0 código duplicado

### Documentation
- [ ] README por feature con ejemplos de uso
- [ ] ADR-002 documentando migración
- [ ] Storybook con todos los componentes del design system
- [ ] ARCHITECTURE.md explicando la estructura

### User Experience
- [ ] Todas las páginas responsive (mobile, tablet, desktop)
- [ ] Dark mode funcional
- [ ] Loading states en todas las queries
- [ ] Error states con mensajes user-friendly
- [ ] Success feedback para mutations
- [ ] Keyboard navigation funcional
- [ ] WCAG AA compliance

---

## 🎯 CHECKLIST FINAL DE MIGRACIÓN

### Estructura
- [ ] `/core/app/` creado con App.tsx, AppRouter.tsx, AppProviders.tsx
- [ ] `/core/container/` creado con container.ts
- [ ] `/features/auth/` completo (domain, application, infrastructure, presentation, config)
- [ ] `/features/teams/` completo (domain, application, infrastructure, presentation, config)
- [ ] `/features/users/` completo (domain, application, infrastructure, presentation, config)
- [ ] `/shared/design-system/` creado con UI components
- [ ] `/shared/providers/` creado con global providers
- [ ] `/shared/infrastructure/routing/` creado con route guards
- [ ] `/pages/` eliminado
- [ ] `/app/` eliminado (contenido movido a `/core`)
- [ ] `/components/` eliminado (contenido movido a `/shared/design-system`)

### Features Functionality
- [ ] Auth: Login/Logout funcional
- [ ] Teams: CRUD completo (Create, Read, Update, Delete)
- [ ] Users: CRUD completo (Create, Read, Update, Delete)
- [ ] Protected routes funcionando
- [ ] Error handling global con toasts
- [ ] Loading states en todas las queries

### UI/UX
- [ ] Design system Shadcn implementado
- [ ] Tailwind CSS configurado
- [ ] Dark mode toggle funcional
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (ARIA, keyboard nav, screen reader)
- [ ] Animations/transitions suaves

### Testing
- [ ] Unit tests para domain entities (Team, User)
- [ ] Unit tests para use cases (90%+ coverage)
- [ ] Integration tests para repositories
- [ ] Component tests para presentation layer
- [ ] E2E tests para flujos críticos (login, create team, create user)

### Documentation
- [ ] README principal actualizado con nueva arquitectura
- [ ] `/docs/ARCHITECTURE.md` creado
- [ ] ADR-002 creado (Web Screaming Architecture)
- [ ] `/features/auth/README.md` completado
- [ ] `/features/teams/README.md` completado
- [ ] `/features/users/README.md` completado
- [ ] Storybook con documentación de componentes

### Performance & Quality
- [ ] Bundle size optimizado (< 500KB gzipped)
- [ ] Lazy loading de features implementado
- [ ] Code splitting por route
- [ ] Lighthouse score 90+ en todas las métricas
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

| Fase | Duración | Descripción | Prioridad |
|------|----------|-------------|-----------|
| **FASE 1** | 1-2 días | Fundamentos (core, shared, providers) | 🔥 CRÍTICA |
| **FASE 2** | 3-4 días | Teams Feature completo | 🔥 CRÍTICA |
| **FASE 3** | 3-4 días | Users Feature completo | 🔥 CRÍTICA |
| **FASE 4** | 3-4 días | Design System (Shadcn/Tailwind) | 🟡 ALTA |
| **FASE 5** | 2 días | Routing feature-based | 🟡 ALTA |
| **FASE 6** | 1 día | Cleanup (eliminar legacy) | 🟢 MEDIA |
| **FASE 7** | 2-3 días | Testing & Documentation | 🟡 ALTA |
| **FASE 8** | 1-2 días | Polish & Optimization | 🟢 MEDIA |

**Total estimado: 16-20 días de desarrollo**

---

## 💡 NOTAS FINALES

### Recomendaciones
- Completar cada fase antes de avanzar a la siguiente
- Mantener tests pasando en todo momento (TDD cuando sea posible)
- Hacer commits pequeños y frecuentes
- Code review después de cada feature
- Documentar decisiones importantes en ADRs

### Prioridades
1. **Primero arquitectura**: FASE 1-3 son críticas (core + 2 features)
2. **Luego UX**: FASE 4-5 mejoran la experiencia de usuario
3. **Finalmente polish**: FASE 6-8 son refinamiento

### Flexibilidad
- Si el tiempo es limitado, FASE 8 puede ser iterativa
- FASE 4 (Design System) puede hacerse en paralelo con FASE 2-3
- FASE 7 (Testing) debería ir en paralelo a cada feature

---

**MODO DIOS ACTIVADO** 🔥

¡Adelante! Screaming Architecture para dominarlos a todos.
