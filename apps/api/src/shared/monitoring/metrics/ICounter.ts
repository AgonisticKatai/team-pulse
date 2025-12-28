/**
 * Counter Metric Interface
 *
 * Abstraction for a counter metric that only increases.
 * Commonly used for counting requests, errors, events, etc.
 */
export interface ICounter {
  /**
   * Increment the counter with optional labels
   *
   * @param options.labels - Optional key-value pairs for metric dimensions (e.g., method, route, error_type)
   * @param options.value - Optional value to increment by (default: 1)
   */
  inc({ labels, value }: { labels?: Record<string, string | number>; value?: number }): void
}
