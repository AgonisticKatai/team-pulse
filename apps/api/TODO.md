# TODO - Technical Debt & Improvements

Este archivo registra mejoras pendientes y tech debt identificado durante el desarrollo.

## 🔴 Alta Prioridad

### Refactor ListUsersUseCase.test.ts
**Ubicación:** `src/application/use-cases/ListUsersUseCase.test.ts`

**Problemas identificados:**
1. **Valores hardcoded sin constantes:**
   - Líneas 170, 191-193: `user${i}@example.com`, `third@example.com`, `first@example.com`, `second@example.com`
   - Debería usar TEST_CONSTANTS o builders

2. **Acceso a arrays con optional chaining:**
   - Líneas 90, 91, 111, 115-116, 146, 161, 203-205: `data.users[0]?.email`
   - Debería usar helper `expectFirst()` para type safety

3. **Mock incorrecto de Result:**
   - Líneas 234-237:
     ```typescript
     vi.mocked(userRepository.findAllPaginated).mockResolvedValueOnce({
       ok: false,
       error: mockError,
     } as any)
     ```
   - Debería usar: `Err(mockError)` en vez de objeto con `as any`

**Acción requerida:**
- Refactorizar test para seguir 100% las best practices
- Eliminar optional chaining usando `expectFirst()`
- Usar TEST_CONSTANTS o valores más semánticos
- Usar `Err()` helper en vez de construir Result manualmente

---

### Aplicar Patrón Creacional a Domain Errors
**Ubicación:** `src/domain/errors/`

**Problema:**
Los Domain Errors actualmente se pueden instanciar con `new ErrorClass()` en algunos casos, lo cual no es consistente con el patrón del resto del dominio (Value Objects, Entities usan `.create()`).

**Archivos afectados:**
- `ValidationError.ts` - Tiene constructor público (ver TODO en el código)
- `DuplicatedError.ts` - Ya usa patrón correcto
- `NotFoundError.ts` - Ya usa patrón correcto
- `RepositoryError.ts` - Ya usa patrón correcto
- `DomainError.ts` - Clase abstracta, OK

**Patrón deseado:**
```typescript
// ❌ ANTI-PATTERN
throw new ValidationError({ message: 'Invalid field', field: 'email' })

// ✅ CORRECT
throw ValidationError.forField({ field: 'email', message: 'Invalid field' })
// o
throw ValidationError.create({ message: 'Invalid field', field: 'email' })
```

**Acción requerida:**
1. Hacer constructor de `ValidationError` privado
2. Asegurar que todos los factory methods cubran todos los casos de uso
3. Migrar código existente que use `new ValidationError()` a factory methods
4. Actualizar tests para usar solo factory methods
5. Documentar el cambio

**Impacto:**
- Breaking change potencial si código externo usa `new ValidationError()`
- Mejora consistencia con el resto del dominio
- Mejor encapsulación y control de creación

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
- [x] Ampliar TEST_CONSTANTS (emails.existing, emails.nonexistent)
- [x] Refactorizar RefreshToken.test.ts (usar TEST_CONSTANTS)
- [x] Refactorizar Team.test.ts (usar TEST_CONSTANTS)
- [x] Refactorizar UpdateTeamUseCase.test.ts (usar expectSuccess)
- [x] Crear tests para Domain Errors (153 tests)

---

## 📝 Notas

- Este archivo debe actualizarse cada vez que se identifique tech debt
- Priorizar según impacto en:
  1. Seguridad
  2. Consistencia del código
  3. Mantenibilidad
  4. Performance

**Última actualización:** 2025-11-19
