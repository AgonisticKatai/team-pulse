/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 *
 * This enables TypeScript to understand import.meta.env
 */
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
