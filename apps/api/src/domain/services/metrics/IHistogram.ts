/**
 * Histogram Metric Interface
 *
 * Abstraction for a histogram metric that tracks the distribution of values.
 * Commonly used for measuring request durations, response sizes, etc.
 */
export interface IHistogram {
  /**
   * Observe a value with labels
   *
   * @param options.labels - Key-value pairs for metric dimensions (e.g., method, route, status_code)
   * @param options.value - The value to observe
   */
  observe({ labels, value }: { labels: Record<string, string | number>; value: number }): void
}
