import { useMutation } from '@tanstack/react-query'
import type { LoginDTO, LoginResponseDTO } from '@team-pulse/shared'
import { loginUseCase } from '@web/core/container/container.js'

/**
 * Login Hook
 *
 * React Query mutation hook for user authentication
 * Handles login state, loading, and error states
 */
export const useLogin = () => {
  return useMutation<LoginResponseDTO, Error, LoginDTO>({
    mutationFn: async (dto: LoginDTO) => {
      const result = await loginUseCase.execute({ dto })

      if (!result.ok) {
        throw result.error
      }

      return result.value
    },
  })
}
