---
description: Create a new feature following project architecture
---

I will create a complete new feature following the project's hexagonal architecture.

Please provide:
1. **Entity name**: (e.g., "Product", "Order")
2. **Entity fields**: (e.g., name, price, description)
3. **Required operations**: (e.g., create, list, update, delete)

I will automatically create:

**Backend:**
1. Domain model in `apps/api/src/domain/models/`
2. Repository interface in `apps/api/src/domain/repositories/`
3. Use cases in `apps/api/src/application/use-cases/`
4. Repository implementation in `apps/api/src/infrastructure/database/repositories/`
5. Drizzle schema in `apps/api/src/infrastructure/database/schemas/`
6. HTTP routes in `apps/api/src/infrastructure/http/routes/`
7. Complete tests with Testcontainers

**Frontend:**
1. Required value objects in `apps/web/src/domain/value-objects/`
2. Repository interface in `apps/web/src/domain/repositories/`
3. Use cases in `apps/web/src/application/use-cases/`
4. API repository implementation in `apps/web/src/infrastructure/repositories/`
5. Custom hook in `apps/web/src/application/hooks/`
6. Components in `apps/web/src/presentation/components/`
7. Pages in `apps/web/src/presentation/pages/`

**Shared:**
1. DTOs in `packages/shared/src/dtos/`

Everything following project conventions and patterns.
