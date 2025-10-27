import type { CreateTeamDTO, TeamResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import { useState } from 'react'
import {
  useCreateTeam,
  useDeleteTeam,
  useTeams,
  useUpdateTeam,
} from '../../application/hooks/useTeams'
import type { TeamApiClient } from '../../infrastructure/api/teamApiClient'
import { TeamForm } from '../components/teams/TeamForm'
import { TeamList } from '../components/teams/TeamList'

/**
 * Teams Page Props
 */
export interface TeamsPageProps {
  teamApiClient: TeamApiClient
}

/**
 * Teams Page (Container Component)
 *
 * This is a SMART COMPONENT that:
 * - Uses custom hooks for data fetching (application layer)
 * - Orchestrates multiple presentational components
 * - Manages local UI state (show/hide form, edit mode)
 * - Handles user interactions
 *
 * This component bridges the application layer and presentation layer.
 */
export function TeamsPage({ teamApiClient }: TeamsPageProps) {
  // Local UI state
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamResponseDTO | null>(null)

  // Data fetching hooks (application layer)
  const { data, isLoading, error } = useTeams(teamApiClient)
  const createMutation = useCreateTeam(teamApiClient)
  const updateMutation = useUpdateTeam(teamApiClient)
  const deleteMutation = useDeleteTeam(teamApiClient)

  // Event handlers
  const handleCreateClick = () => {
    setEditingTeam(null)
    setShowForm(true)
  }

  const handleEditClick = (team: TeamResponseDTO) => {
    setEditingTeam(team)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingTeam(null)
  }

  const handleSubmit = async (formData: CreateTeamDTO | UpdateTeamDTO) => {
    try {
      if (editingTeam) {
        // Update existing team
        await updateMutation.mutateAsync({
          id: editingTeam.id,
          data: formData as UpdateTeamDTO,
        })
      } else {
        // Create new team
        await createMutation.mutateAsync(formData as CreateTeamDTO)
      }

      // Close form on success
      setShowForm(false)
      setEditingTeam(null)
    } catch (error) {
      // Error is handled by the mutation
      console.error('Form submission error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      // Error is handled by the mutation
      alert('Failed to delete team. Please try again.')
    }
  }

  const teams = data?.teams || []
  const mutationError = createMutation.error || updateMutation.error || deleteMutation.error

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: '#fff' }}>Teams</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#888' }}>Manage your football teams</p>
        </div>

        <button
          type="button"
          onClick={handleCreateClick}
          disabled={showForm}
          className="create-team-button"
          style={{
            opacity: showForm ? 0.5 : 1,
          }}
        >
          + Create Team
        </button>
      </div>

      {/* Form (conditional) */}
      {showForm && (
        <div style={{ marginBottom: '2rem' }}>
          <TeamForm
            initialData={editingTeam || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            error={mutationError}
          />
        </div>
      )}

      {/* Teams List */}
      <TeamList
        teams={teams}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        isLoading={isLoading}
        error={error}
      />

      {/* Stats Footer */}
      {!isLoading && !error && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            textAlign: 'center',
            color: '#888',
            fontSize: '0.875rem',
          }}
        >
          Total teams: {data?.total || 0}
        </div>
      )}
    </div>
  )
}
