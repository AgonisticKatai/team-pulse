---
description: Create complete tests for current code
---

I will create complete tests following project conventions.

For the code you're working on, I'll create:

**Backend (if applicable):**
1. **Domain tests**: Entities, validations, methods
2. **Use case tests**: With repository mocks
3. **Integration tests**: With Testcontainers (isolated PostgreSQL)
4. **HTTP route tests**: End-to-end with real database

**Frontend (if applicable):**
1. **Value object tests**: Validations, methods
2. **Use case tests**: With repository mocks
3. **Component tests**: Testing Library, user behavior
4. **Hook tests**: Custom hooks

**Features:**
- Testcontainers for backend (isolated database per suite)
- Complete edge case coverage
- Readable and maintainable tests
- Following AAA pattern (Arrange, Act, Assert)

What code needs testing?
