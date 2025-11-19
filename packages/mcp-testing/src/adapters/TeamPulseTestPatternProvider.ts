import type { ITestPatternProvider, TestPatternCategory } from '../domain/ITestPatternProvider.js'

/**
 * TeamPulse Test Pattern Provider
 *
 * This is an ADAPTER in hexagonal architecture:
 * - Implements ITestPatternProvider interface (PORT)
 * - Provides TeamPulse-specific testing patterns and best practices
 * - Pure data provider, no external dependencies
 */
export class TeamPulseTestPatternProvider implements ITestPatternProvider {
  private constructor() {}

  static create(): TeamPulseTestPatternProvider {
    return new TeamPulseTestPatternProvider()
  }

  getPatterns({ category }: { category: TestPatternCategory }): string {
    let patterns = 'TeamPulse Testing Patterns\n'
    patterns += '===========================\n\n'

    if (category === 'all' || category === 'unit-tests') {
      patterns += this.getUnitTestPatterns()
    }

    if (category === 'all' || category === 'integration-tests') {
      patterns += this.getIntegrationTestPatterns()
    }

    if (category === 'all' || category === 'test-data') {
      patterns += this.getTestDataPatterns()
    }

    if (category === 'all' || category === 'mocking') {
      patterns += this.getMockingPatterns()
    }

    patterns += this.getBestPractices()

    return patterns
  }

  private getUnitTestPatterns(): string {
    return `## Unit Tests

- Tests are colocated with source files (*.test.ts pattern)
- Use Vitest as the testing framework
- Follow AAA pattern: Arrange, Act, Assert in test structure
- Use descriptive test names: 'should [expected behavior] when [condition]'

`
  }

  private getIntegrationTestPatterns(): string {
    return `## Integration Tests

- API integration tests use Testcontainers for PostgreSQL
- Tests run against real database instances
- Each test suite gets a fresh database container
- Use supertest for HTTP endpoint testing in API package

`
  }

  private getTestDataPatterns(): string {
    return `## Test Data

- Shared test utilities available in @team-pulse/shared
- Use TEST_CONSTANTS for consistent test data across packages
- Factory functions create valid domain objects for tests
- In-memory repositories available for unit testing use cases

`
  }

  private getMockingPatterns(): string {
    return `## Mocking

- Use Vitest's vi.fn() and vi.mock() for mocking dependencies
- Repository interfaces are mocked using in-memory implementations
- External services mocked at the infrastructure layer
- Avoid mocking domain logic - test it with real implementations

`
  }

  private getBestPractices(): string {
    return `## Best Practices

1. Test behavior, not implementation details
2. One assertion concept per test
3. Keep tests independent and isolated
4. Use meaningful test data that tells a story
5. Clean up resources in afterEach/afterAll hooks
6. Prefer integration tests for critical paths
`
  }
}
