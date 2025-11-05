import { describe, expect, it } from 'vitest'
import { Err, flatMap, isError, isOk, map, Ok, type Result, unwrap, unwrapOr } from './Result.js'

describe('Result Type', () => {
  describe('Ok', () => {
    it('should create a successful result', () => {
      // Arrange & Act
      const [error, value] = Ok('success')

      // Assert
      expect(error).toBeNull()
      expect(value).toBe('success')
    })

    it('should create Ok result with number', () => {
      // Arrange & Act
      const [error, value] = Ok(42)

      // Assert
      expect(error).toBeNull()
      expect(value).toBe(42)
    })

    it('should create Ok result with object', () => {
      // Arrange
      const data = { id: '123', name: 'Test' }

      // Act
      const [error, value] = Ok(data)

      // Assert
      expect(error).toBeNull()
      expect(value).toEqual(data)
    })

    it('should create Ok result with null value', () => {
      // Arrange & Act
      const [error, value] = Ok(null)

      // Assert
      expect(error).toBeNull()
      expect(value).toBeNull()
    })

    it('should create Ok result with undefined value', () => {
      // Arrange & Act
      const [error, value] = Ok(undefined)

      // Assert
      expect(error).toBeNull()
      expect(value).toBeUndefined()
    })
  })

  describe('Err', () => {
    it('should create an error result', () => {
      // Arrange
      const errorInstance = new Error('Something went wrong')

      // Act
      const [error, value] = Err(errorInstance)

      // Assert
      expect(error).toBe(errorInstance)
      expect(value).toBeNull()
    })

    it('should create error result with custom error', () => {
      // Arrange
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }
      const errorInstance = new CustomError('Custom error message')

      // Act
      const [error, value] = Err(errorInstance)

      // Assert
      expect(error).toBe(errorInstance)
      expect(error?.name).toBe('CustomError')
      expect(value).toBeNull()
    })
  })

  describe('isError', () => {
    it('should return true for error result', () => {
      // Arrange
      const result: Result<string, Error> = Err(new Error('Error'))

      // Act
      const hasError = isError(result)

      // Assert
      expect(hasError).toBe(true)
    })

    it('should return false for success result', () => {
      // Arrange
      const result: Result<string, Error> = Ok('success')

      // Act
      const hasError = isError(result)

      // Assert
      expect(hasError).toBe(false)
    })

    it('should narrow type when true', () => {
      // Arrange
      const result: Result<string, Error> = Err(new Error('Error'))

      // Act & Assert
      if (isError(result)) {
        // TypeScript should know result[0] is Error
        const [error] = result
        expect(error.message).toBe('Error')
      } else {
        // This should not execute
        expect.fail('Should have been an error')
      }
    })
  })

  describe('isOk', () => {
    it('should return true for success result', () => {
      // Arrange
      const result: Result<string, Error> = Ok('success')

      // Act
      const success = isOk(result)

      // Assert
      expect(success).toBe(true)
    })

    it('should return false for error result', () => {
      // Arrange
      const result: Result<string, Error> = Err(new Error('Error'))

      // Act
      const success = isOk(result)

      // Assert
      expect(success).toBe(false)
    })

    it('should narrow type when true', () => {
      // Arrange
      const result: Result<string, Error> = Ok('success')

      // Act & Assert
      if (isOk(result)) {
        // TypeScript should know result[1] is string
        const [, value] = result
        expect(value.toUpperCase()).toBe('SUCCESS')
      } else {
        // This should not execute
        expect.fail('Should have been successful')
      }
    })
  })

  describe('unwrap', () => {
    it('should return value for success result', () => {
      // Arrange
      const result = Ok('success')

      // Act
      const value = unwrap(result)

      // Assert
      expect(value).toBe('success')
    })

    it('should throw error for error result', () => {
      // Arrange
      const error = new Error('Something went wrong')
      const result = Err(error)

      // Act & Assert
      expect(() => unwrap(result)).toThrow('Something went wrong')
    })

    it('should preserve error type when throwing', () => {
      // Arrange
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }
      const error = new CustomError('Custom error')
      const result = Err(error)

      // Act & Assert
      expect(() => unwrap(result)).toThrow(CustomError)
    })
  })

  describe('unwrapOr', () => {
    it('should return value for success result', () => {
      // Arrange
      const result = Ok('success')

      // Act
      const value = unwrapOr(result, 'default')

      // Assert
      expect(value).toBe('success')
    })

    it('should return default for error result', () => {
      // Arrange
      const result: Result<string, Error> = Err(new Error('Error'))

      // Act
      const value = unwrapOr(result, 'default')

      // Assert
      expect(value).toBe('default')
    })

    it('should return default for different types', () => {
      // Arrange
      const result: Result<number, Error> = Err(new Error('Error'))

      // Act
      const value = unwrapOr(result, 0)

      // Assert
      expect(value).toBe(0)
    })

    it('should work with object defaults', () => {
      // Arrange
      type User = { id: string; name: string }
      const result: Result<User, Error> = Err(new Error('Error'))
      const defaultUser: User = { id: '0', name: 'Unknown' }

      // Act
      const value = unwrapOr(result, defaultUser)

      // Assert
      expect(value).toEqual(defaultUser)
    })
  })

  describe('map', () => {
    it('should transform success result', () => {
      // Arrange
      const result = Ok(5)

      // Act
      const [error, value] = map(result, (n) => n * 2)

      // Assert
      expect(error).toBeNull()
      expect(value).toBe(10)
    })

    it('should preserve error result', () => {
      // Arrange
      const errorInstance = new Error('Error')
      const result: Result<number, Error> = Err(errorInstance)

      // Act
      const [error, value] = map(result, (n) => n * 2)

      // Assert
      expect(error).toBe(errorInstance)
      expect(value).toBeNull()
    })

    it('should chain multiple maps', () => {
      // Arrange
      const result = Ok(5)

      // Act
      const [error, value] = map(
        map(result, (n) => n * 2),
        (n) => n + 1,
      )

      // Assert
      expect(error).toBeNull()
      expect(value).toBe(11)
    })

    it('should work with type transformations', () => {
      // Arrange
      const result = Ok(42)

      // Act
      const [error, value] = map(result, (n) => `Number: ${n}`)

      // Assert
      expect(error).toBeNull()
      expect(value).toBe('Number: 42')
    })

    it('should not execute mapper for error', () => {
      // Arrange
      const errorInstance = new Error('Error')
      const result: Result<number, Error> = Err(errorInstance)
      let executed = false

      // Act
      const [error, value] = map(result, (n) => {
        executed = true
        return n * 2
      })

      // Assert
      expect(executed).toBe(false)
      expect(error).toBe(errorInstance)
      expect(value).toBeNull()
    })
  })

  describe('flatMap', () => {
    it('should chain Result-returning operations successfully', () => {
      // Arrange
      const result = Ok(5)
      const operation = (n: number): Result<number, Error> =>
        n > 0 ? Ok(n * 2) : Err(new Error('Negative number'))

      // Act
      const [error, value] = flatMap(result, operation)

      // Assert
      expect(error).toBeNull()
      expect(value).toBe(10)
    })

    it('should propagate original error', () => {
      // Arrange
      const errorInstance = new Error('Original error')
      const result: Result<number, Error> = Err(errorInstance)
      const operation = (n: number): Result<number, Error> => Ok(n * 2)

      // Act
      const [error, value] = flatMap(result, operation)

      // Assert
      expect(error).toBe(errorInstance)
      expect(value).toBeNull()
    })

    it('should propagate operation error', () => {
      // Arrange
      const result = Ok(-5)
      const operation = (n: number): Result<number, Error> =>
        n > 0 ? Ok(n * 2) : Err(new Error('Negative number'))

      // Act
      const [error, value] = flatMap(result, operation)

      // Assert
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Negative number')
      expect(value).toBeNull()
    })

    it('should chain multiple flatMap operations', () => {
      // Arrange
      const result = Ok(5)
      const double = (n: number): Result<number, Error> => Ok(n * 2)
      const increment = (n: number): Result<number, Error> => Ok(n + 1)

      // Act
      const [error, value] = flatMap(flatMap(result, double), increment)

      // Assert
      expect(error).toBeNull()
      expect(value).toBe(11)
    })

    it('should not execute operation for error', () => {
      // Arrange
      const errorInstance = new Error('Error')
      const result: Result<number, Error> = Err(errorInstance)
      let executed = false

      // Act
      const [error, value] = flatMap(result, (n) => {
        executed = true
        return Ok(n * 2)
      })

      // Assert
      expect(executed).toBe(false)
      expect(error).toBe(errorInstance)
      expect(value).toBeNull()
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle entity creation pattern', () => {
      // Arrange
      const createUser = (email: string): Result<{ id: string; email: string }, Error> => {
        if (!email.includes('@')) {
          return Err(new Error('Invalid email'))
        }
        return Ok({ email, id: '123' })
      }

      // Act - Success case
      const [error1, user1] = createUser('test@example.com')

      // Assert
      expect(error1).toBeNull()
      expect(user1).toBeDefined()
      expect(user1!.email).toBe('test@example.com')

      // Act - Error case
      const [error2, user2] = createUser('invalid-email')

      // Assert
      expect(error2).toBeInstanceOf(Error)
      expect(error2!.message).toBe('Invalid email')
      expect(user2).toBeNull()
    })

    it('should handle chaining with validation', () => {
      // Arrange
      const validateEmail = (email: string): Result<string, Error> =>
        email.includes('@') ? Ok(email) : Err(new Error('Invalid email'))

      const createUser = (email: string): Result<{ id: string; email: string }, Error> =>
        Ok({ email, id: '123' })

      // Act
      const [error, user] = flatMap(validateEmail('test@example.com'), createUser)

      // Assert
      expect(error).toBeNull()
      expect(user?.email).toBe('test@example.com')
    })

    it('should handle error propagation in chains', () => {
      // Arrange
      const validateEmail = (email: string): Result<string, Error> =>
        email.includes('@') ? Ok(email) : Err(new Error('Invalid email'))

      const createUser = (email: string): Result<{ id: string; email: string }, Error> =>
        Ok({ email, id: '123' })

      // Act
      const [error, user] = flatMap(validateEmail('invalid'), createUser)

      // Assert
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Invalid email')
      expect(user).toBeNull()
    })

    it('should work with type guards in control flow', () => {
      // Arrange
      const result: Result<number, Error> = Ok(42)

      // Act & Assert
      if (isError(result)) {
        expect.fail('Should not reach here')
      } else {
        const [, value] = result
        expect(value).toBe(42)
      }
    })

    it('should handle default values gracefully', () => {
      // Arrange
      const fetchUser = (id: string): Result<{ name: string }, Error> => {
        if (id === '404') {
          return Err(new Error('User not found'))
        }
        return Ok({ name: 'John Doe' })
      }

      // Act - Success case
      const user1 = unwrapOr(fetchUser('123'), { name: 'Guest' })

      // Assert
      expect(user1.name).toBe('John Doe')

      // Act - Error case with default
      const user2 = unwrapOr(fetchUser('404'), { name: 'Guest' })

      // Assert
      expect(user2.name).toBe('Guest')
    })
  })
})
