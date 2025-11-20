# 🚨 MANDATORY RULES - READ AT SESSION START

**⚠️ CRITICAL: Read this file FIRST in every session. These are NON-NEGOTIABLE patterns.**

---

## ❌ NEVER DO THIS

1. **Positional parameters** → ALWAYS use named parameters
   ```typescript
   ❌ create(value: string)
   ✅ create({ value }: { value: string })
   ```

2. **Hacks or workarounds** → Only clean, standard solutions
   - NO `as any`, `!`, or type assertions without justification
   - NO inline linter disable comments without explanation
   - If something requires a hack, ASK FIRST

3. **`private static` for methods used in same class** → Use `protected static`
   - Biome has false positive detecting usage
   - See TODO.md for full context

4. **Write files without Read first** → ALWAYS Read before Write
   - ALWAYS prefer Edit over Write
   - DO NOT create documentation (*.md) unless explicitly requested

5. **Mix architecture layers**
   ```typescript
   ❌ Domain imports from Infrastructure
   ❌ Application imports from Presentation
   ✅ Infrastructure implements Domain ports
   ```

---

## ✅ ALWAYS DO THIS

1. **Private constructor + static factory methods**
   ```typescript
   class User {
     private constructor(props: UserProps) {}
     static create(data: CreateUserData): Result<User, ValidationError>
     static fromValueObjects(props: UserProps): User
   }
   ```

2. **Result<T, E> for all fallible operations**
   ```typescript
   ✅ async execute(): Promise<Result<UserDTO, ValidationError>>
   ❌ async execute(): Promise<UserDTO> // might throw
   ```

3. **Named parameters in ALL methods**
   ```typescript
   ✅ findById({ id }: { id: string })
   ❌ findById(id: string)
   ```

4. **AAA pattern in tests with builders**
   ```typescript
   // Arrange
   const dto = buildCreateUserDTO()
   // Act
   const result = await useCase.execute(dto)
   // Assert
   const data = expectSuccess(result)
   ```

5. **Hexagonal Architecture**
   - Interfaces (Ports) in `domain/`
   - Implementations (Adapters) in `infrastructure/`
   - Use Cases orchestrate without knowing HTTP/DB details

---

## 📚 REFERENCES

- **Full patterns with examples**: See `AGREEMENTS.md`
- **Project context**: See `context.md`
- **Tech debt**: See `TODO.md`

---

## 🔍 QUICK CHECKLIST BEFORE CODING

- [ ] Am I using named parameters?
- [ ] Am I returning Result<T, E>?
- [ ] Does my constructor use private + factory pattern?
- [ ] Am I respecting layer boundaries?
- [ ] Did I read existing code before creating new files?
