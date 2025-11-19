# TODO - Technical Debt & Improvements

Este archivo registra mejoras pendientes y tech debt identificado durante el desarrollo.

## 🔴 Alta Prioridad

_(No hay tareas de alta prioridad pendientes)_

---

## 🟡 Media Prioridad

### Revisar otros Use Case tests por patrones similares
**Acción:** Auditar ListTeamsUseCase.test.ts y otros para patrones similares a ListUsersUseCase

---

## 🟢 Baja Prioridad

### Considerar helpers adicionales
- `expectEmpty()` - Para arrays vacíos
- `expectNonEmpty()` - Para arrays con al menos 1 elemento
- Evaluar necesidad basada en patrones recurrentes

---

## ✅ Completado

- [x] Crear TESTING.md con best practices
- [x] Crear helpers (expectSingle, expectFirst, expectArrayOfLength)
- [x] Ampliar TEST_CONSTANTS (emails.existing, emails.nonexistent, first, second, third)
- [x] Refactorizar RefreshToken.test.ts (usar TEST_CONSTANTS)
- [x] Refactorizar Team.test.ts (usar TEST_CONSTANTS)
- [x] Refactorizar UpdateTeamUseCase.test.ts (usar expectSuccess)
- [x] Crear tests para Domain Errors (153 tests)
- [x] **Refactorizar ListUsersUseCase.test.ts** (eliminar hardcoded, usar expectFirst, corregir mocks con Err())
- [x] **Aplicar patrón creacional a Domain Errors** (constructores privados en ValidationError, DuplicatedError, NotFoundError)
- [x] **Migrar código a factory methods** (actualizar todos los tests de Domain Errors)

---

## 📝 Notas

- Este archivo debe actualizarse cada vez que se identifique tech debt
- Priorizar según impacto en:
  1. Seguridad
  2. Consistencia del código
  3. Mantenibilidad
  4. Performance

**Última actualización:** 2025-11-19
