---
description: Review if code respects hexagonal architecture
---

Review the code I'm modifying or creating and verify that:

1. **Respects hexagonal architecture layers**:
   - Domain doesn't import from Application or Infrastructure
   - Application only imports from Domain
   - Infrastructure can import from Domain and Application

2. **Follows DDD patterns**:
   - Rich entities with validation and behavior (backend)
   - Immutable value objects (frontend)
   - Use cases with single responsibility

3. **Uses repositories correctly**:
   - Interfaces defined in Domain
   - Implementations in Infrastructure
   - Correct dependency injection

4. **Correct naming**:
   - Use cases: `{Action}{Entity}UseCase`
   - Repositories: `{Implementation}{Entity}Repository`
   - Interfaces: `I{Name}Repository`

If you find violations, explain them and suggest how to fix them.
