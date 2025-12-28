/**
 * Gauge Metric Interface
 *
 * Abstraction for a gauge metric that can go up and down.
 * Commonly used for measuring current values like active connections,
 * memory usage, queue size, etc.
 */
export interface IGauge {
  /**
   * Set the gauge to a specific value
   *
   * @param options.value - The value to set
   * @param options.labels - Optional key-value pairs for metric dimensions
   */
  set({ value, labels }: { value: number; labels?: Record<string, string | number> }): void

  /**
   * Increment the gauge
   *
   * @param options.value - Optional value to increment by (default: 1)
   */
  inc({ value }: { value?: number }): void

  /**
   * Decrement the gauge
   *
   * @param options.value - Optional value to decrement by (default: 1)
   */
  dec({ value }: { value?: number }): void
}
