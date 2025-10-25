// Additional shared types will be defined here as we progress

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
