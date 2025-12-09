import { Ok, type Result } from '@team-pulse/shared'
import type { ITestPatternProvider, TestPatternCategory } from '../domain/ITestPatternProvider.js'

/**
 * Get Test Patterns Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Retrieves testing patterns documentation
 * - Delegates to pattern provider
 * - Simple pass-through, but maintains use case layer consistency
 */
export class GetTestPatternsUseCase {
  private readonly patternProvider: ITestPatternProvider

  private constructor({ patternProvider }: { patternProvider: ITestPatternProvider }) {
    this.patternProvider = patternProvider
  }

  static create({ patternProvider }: { patternProvider: ITestPatternProvider }): GetTestPatternsUseCase {
    return new GetTestPatternsUseCase({ patternProvider })
  }

  execute({ category }: { category: TestPatternCategory }): Result<string, Error> {
    const patterns = this.patternProvider.getPatterns({ category })
    return Ok(patterns)
  }
}
