import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateTeamDTO,
  TeamResponseDTO,
  TeamsListResponseDTO,
  UpdateTeamDTO,
} from '@team-pulse/shared'
import type { ApiError } from '../../infrastructure/api/apiClient'
import type { TeamApiClient } from '../../infrastructure/api/teamApiClient'

/**
 * Teams Query Keys
 *
 * Centralized query key factory for Teams domain.
 * This ensures consistency and makes cache invalidation easy.
 */
export const teamsKeys = {
  all: ['teams'] as const,
  lists: () => [...teamsKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...teamsKeys.lists(), filters] as const,
  details: () => [...teamsKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamsKeys.details(), id] as const,
}

/**
 * Use Teams Hook (Application Layer)
 *
 * Fetches and manages the list of all teams.
 *
 * Features:
 * - Automatic caching with React Query
 * - Loading and error states
 * - Automatic refetch on window focus
 * - Stale-while-revalidate pattern
 *
 * @param teamApiClient - Team API client instance
 * @returns Query result with teams data, loading, and error states
 */
export function useTeams(teamApiClient: TeamApiClient) {
  return useQuery<TeamsListResponseDTO, ApiError>({
    queryKey: teamsKeys.list(),
    queryFn: () => teamApiClient.getTeams(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  })
}

/**
 * Use Team Hook (Application Layer)
 *
 * Fetches a single team by ID.
 *
 * @param teamApiClient - Team API client instance
 * @param id - Team ID
 * @returns Query result with team data
 */
export function useTeam(teamApiClient: TeamApiClient, id: string) {
  return useQuery<TeamResponseDTO, ApiError>({
    queryKey: teamsKeys.detail(id),
    queryFn: () => teamApiClient.getTeam(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Use Create Team Hook (Application Layer)
 *
 * Mutation hook for creating a new team.
 *
 * Features:
 * - Optimistic updates (optional)
 * - Automatic cache invalidation
 * - Error handling
 * - Success callbacks
 *
 * @param teamApiClient - Team API client instance
 * @returns Mutation object with mutate function and states
 */
export function useCreateTeam(teamApiClient: TeamApiClient) {
  const queryClient = useQueryClient()

  return useMutation<TeamResponseDTO, ApiError, CreateTeamDTO>({
    mutationFn: (data: CreateTeamDTO) => teamApiClient.createTeam(data),
    onSuccess: () => {
      // Invalidate teams list to trigger refetch
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
    },
  })
}

/**
 * Use Update Team Hook (Application Layer)
 *
 * Mutation hook for updating an existing team.
 *
 * @param teamApiClient - Team API client instance
 * @returns Mutation object with mutate function
 */
export function useUpdateTeam(teamApiClient: TeamApiClient) {
  const queryClient = useQueryClient()

  return useMutation<TeamResponseDTO, ApiError, { id: string; data: UpdateTeamDTO }>({
    mutationFn: ({ id, data }) => teamApiClient.updateTeam(id, data),
    onSuccess: (updatedTeam) => {
      // Invalidate both list and specific team detail
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: teamsKeys.detail(updatedTeam.id),
      })
    },
  })
}

/**
 * Use Delete Team Hook (Application Layer)
 *
 * Mutation hook for deleting a team.
 *
 * @param teamApiClient - Team API client instance
 * @returns Mutation object with mutate function
 */
export function useDeleteTeam(teamApiClient: TeamApiClient) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (id: string) => teamApiClient.deleteTeam(id),
    onSuccess: () => {
      // Invalidate teams list to trigger refetch
      queryClient.invalidateQueries({ queryKey: teamsKeys.lists() })
    },
  })
}
