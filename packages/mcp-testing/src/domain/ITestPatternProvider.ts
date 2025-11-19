/**
 * Test Pattern Category
 */
export type TestPatternCategory = 'all' | 'unit-tests' | 'integration-tests' | 'test-data' | 'mocking'

/**
 * Test Pattern Provider Port
 *
 * Defines the contract for providing testing pattern documentation
 * This is a PORT in hexagonal architecture
 */
export interface ITestPatternProvider {
  /**
   * Get testing patterns documentation
   */
  getPatterns(params: { category: TestPatternCategory }): string
}
