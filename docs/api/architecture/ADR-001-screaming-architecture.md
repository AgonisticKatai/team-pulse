# ADR-001: Migración a Screaming Architecture

## Estado
**Aceptado** - Implementado en Diciembre 2024

## Contexto

La API de TeamPulse inicialmente se organizó siguiendo una arquitectura por capas técnicas (Hexagonal Architecture clásica):

```
src/
├── domain/           # Todas las entidades juntas
├── application/      # Todos los casos de uso juntos
└── infrastructure/   # Toda la infraestructura junta
```

**Problemas identificados:**

1. **Falta de claridad del dominio**: Al abrir el proyecto, no era obvio qué features implementa la aplicación (teams, users, auth)
2. **Alta cohesión por capa, baja cohesión por feature**: Cambios en una feature requerían tocar múltiples carpetas dispersas
3. **Acoplamiento entre features**: Features como `auth` y `users` estaban fuertemente acopladas a través de dependencias directas
4. **Dificultad para navegar el código**: Encontrar todo el código relacionado con "teams" requería buscar en 3+ carpetas
5. **Escalabilidad limitada**: Agregar nuevas features implicaba modificar estructuras monolíticas compartidas
6. **Violación del principio de proximidad**: Código que cambia junto no estaba junto físicamente

## Decisión

Migrar a **Screaming Architecture** con organización por features, manteniendo los principios de Hexagonal Architecture dentro de cada feature.

### Nueva estructura:

```
src/
├── features/                    # Features del negocio (SCREAMING)
│   ├── auth/                   # Feature de autenticación
│   │   ├── application/        # Casos de uso de auth
│   │   ├── domain/            # Entidades y VOs de auth
│   │   ├── infrastructure/    # Adaptadores de auth
│   │   └── config/            # DI container de auth
│   ├── users/                 # Feature de usuarios
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── config/
│   └── teams/                 # Feature de equipos
│       ├── application/
│       ├── domain/
│       ├── infrastructure/
│       └── config/
├── shared/                    # Código compartido (infraestructura, utilities)
│   ├── database/
│   ├── http/
│   ├── security/
│   └── testing/
└── core/                      # Núcleo de la aplicación
    ├── app/                  # Configuración de Fastify
    └── container/            # Composición de features
```

### Principios aplicados:

1. **Feature-first organization**: Las carpetas de primer nivel gritan el dominio del negocio
2. **Vertical slicing**: Cada feature contiene todas sus capas (domain, application, infrastructure)
3. **Autonomía de features**: Cada feature tiene su propio DI container
4. **Shared kernel mínimo**: Solo infraestructura técnica compartida (database, http, security)
5. **Hexagonal Architecture por feature**: Cada feature sigue ports & adapters internamente

## Alternativas Consideradas

### 1. Mantener arquitectura por capas
**Rechazada**: No resolvía los problemas de navegación y claridad del dominio.

### 2. Modular Monolith con módulos independientes
**Rechazada**: Demasiado complejo para el tamaño actual del proyecto. Screaming Architecture es más simple y ofrece beneficios similares.

### 3. Microservicios
**Rechazada**: Sobrecomplejo para las necesidades actuales. La separación por features nos permite evolucionar a microservicios si fuera necesario.

## Consecuencias

### Positivas ✅

1. **Claridad del dominio**: El directorio `features/` muestra inmediatamente qué hace la aplicación
2. **Alta cohesión**: Todo el código de una feature está junto físicamente
3. **Bajo acoplamiento**: Features se comunican a través de interfaces bien definidas
4. **Fácil navegación**: Buscar código de "teams" → ir a `features/teams/`
5. **Mejor testabilidad**: Cada feature puede ser testeada de forma aislada
6. **Escalabilidad**: Agregar nuevas features no requiere modificar estructuras existentes
7. **Preparación para microservicios**: La separación clara facilita extracción futura
8. **Onboarding más rápido**: Nuevos desarrolladores entienden el dominio inmediatamente

### Negativas ⚠️

1. **Más carpetas**: Más niveles de anidación en la estructura de directorios
2. **Código compartido**: Necesidad de identificar qué va a `shared/` vs feature-specific
3. **Refactor masivo**: La migración inicial requirió mover ~100 archivos
4. **Duplicación potencial**: Riesgo de duplicar código que debería estar en `shared/`

### Neutrales ℹ️

1. **Curva de aprendizaje**: Desarrolladores acostumbrados a layered architecture necesitan adaptarse
2. **Decisiones de diseño**: Cada feature puede evolucionar su arquitectura interna independientemente

## Implementación

### Fase 1: Creación de estructura ✅
- Crear directorios `features/{auth,users,teams}`
- Mover entidades, casos de uso e infraestructura a sus features
- Crear `shared/` para código compartido

### Fase 2: Desacoplamiento ✅
- Mover `IPasswordHasher` de `users/` a `shared/security/`
- Mover `TokenFactory` de `users/` a `auth/application/factories/`
- Romper dependencias circulares entre features

### Fase 3: Dependency Injection ✅
- Crear feature containers (`AuthContainer`, `UsersContainer`, `TeamsContainer`)
- Refactorizar `Container` monolítico para componer features
- Lazy initialization via getters

### Fase 4: Testing ✅
- Mover test helpers a `shared/testing/`
- Crear tests específicos por feature
- Verificar 387 tests pasando

### Fase 5: Documentación ✅
- Crear READMEs por feature explicando arquitectura y responsabilidades
- Documentar ADR (este documento)

## Métricas de Éxito

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tests pasando | 349/349 | 387/387 | +38 tests |
| Features claras | ❌ No obvio | ✅ 3 features visibles | 100% |
| Navegación | 3+ carpetas | 1 carpeta por feature | 66% más rápido |
| Acoplamiento | Alto (directo) | Bajo (inyectado) | ✅ Desacoplado |
| Líneas de Container | 287 líneas | 145 líneas | -49% |

## Referencias

### Conceptos
- **Screaming Architecture**: Robert C. Martin (Uncle Bob)
  - "The architecture should scream the intent of the system"
  - https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html

- **Hexagonal Architecture**: Alistair Cockburn
  - Ports & Adapters pattern
  - https://alistair.cockburn.us/hexagonal-architecture/

- **Vertical Slice Architecture**: Jimmy Bogard
  - Feature-based organization
  - https://jimmybogard.com/vertical-slice-architecture/

### Implementación
- Kysely migration con `ifNotExists()` para idempotencia
- Feature containers con lazy initialization
- Cross-feature dependencies via constructor injection

## Aprendizajes

### Lo que funcionó bien ✅
1. **Migración incremental**: Mover feature por feature permitió mantener tests verdes
2. **Feature containers**: DI por feature simplificó la composición
3. **Shared kernel mínimo**: Solo infraestructura técnica compartida evitó acoplamiento
4. **Tests como red de seguridad**: 387 tests garantizaron que la refactorización fue exitosa

### Lo que mejoraríamos 🔧
1. **Planificación inicial**: Identificar todas las dependencias cross-feature antes de empezar
2. **Documentación continua**: Escribir READMEs durante la migración, no al final
3. **Automatización**: Scripts para validar que features no importan entre sí directamente

## Evolución Futura

### Corto plazo (1-3 meses)
- [ ] Agregar linting rules para prevenir imports cross-feature
- [ ] Documentar convenciones de naming para features
- [ ] Crear plantilla para nuevas features

### Medio plazo (3-6 meses)
- [ ] Implementar event bus para comunicación cross-feature
- [ ] Agregar feature flags por feature
- [ ] Métricas de cohesión y acoplamiento automatizadas

### Largo plazo (6-12 meses)
- [ ] Evaluar extracción de features a microservicios si el contexto lo requiere
- [ ] Domain events para desacoplar features completamente
- [ ] CQRS pattern para features de lectura/escritura complejas

## Notas Adicionales

### Reglas de diseño establecidas

1. **Nunca importar entre features**: Las features NO deben importar directamente de otras features
   - ❌ `import { User } from '@features/users/domain/entities/user'`
   - ✅ `import { IUserRepository } from '@features/users/domain/repositories/user'` (inyectado)

2. **Shared solo para infraestructura**: `shared/` solo contiene código técnico, no de negocio
   - ✅ Database, HTTP, Security, Testing
   - ❌ Entidades de dominio, casos de uso

3. **Un container por feature**: Cada feature gestiona sus propias dependencias
   - `AuthContainer`, `UsersContainer`, `TeamsContainer`
   - Container principal compone features

4. **Lazy initialization**: Dependencias se crean bajo demanda
   - Mejora tiempo de inicio
   - Facilita testing

### Checklist para nuevas features

Cuando agregues una nueva feature, asegúrate de:

- [ ] Crear estructura `features/{nombre}/` con carpetas application, domain, infrastructure, config
- [ ] Crear feature container en `config/{nombre}.container.ts`
- [ ] Exponer container en `core/container/container.ts`
- [ ] Crear README.md explicando la feature
- [ ] Agregar routes en `core/app/app.ts`
- [ ] Escribir tests unitarios e integración
- [ ] Documentar endpoints en README

## Autores
- Equipo TeamPulse
- Fecha: Diciembre 2024
- Versión: 1.0

## Cambios
| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2024-12-28 | 1.0 | Versión inicial - Migración completa implementada |
