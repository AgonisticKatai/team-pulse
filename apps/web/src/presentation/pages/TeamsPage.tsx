import type { CreateTeamDTO, TeamResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import { useState } from 'react'
import { useAuth } from '../../application/hooks/use-auth'
import { useCreateTeam, useDeleteTeam, useTeams, useUpdateTeam } from '../../application/hooks/use-teams'
import type { TeamApiClient } from '../../infrastructure/api/team-api-client'
import { DashboardLayout } from '../components/layout/DashboardLayout'
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
  // Auth state
  const { user } = useAuth()

  // Local UI state
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamResponseDTO | null>(null)

  // Data fetching hooks (application layer)
  const { data, isLoading, error } = useTeams(teamApiClient)
  const createMutation = useCreateTeam(teamApiClient)
  const updateMutation = useUpdateTeam(teamApiClient)
  const deleteMutation = useDeleteTeam(teamApiClient)

  // Check if user can edit/delete (only SUPER_ADMIN and ADMIN)
  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'

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
          data: formData as UpdateTeamDTO,
          id: editingTeam.id,
        })
      } else {
        // Create new team
        await createMutation.mutateAsync(formData as CreateTeamDTO)
      }

      // Close form on success
      setShowForm(false)
      setEditingTeam(null)
    } catch (_error) {
      // Intentionally ignoring errors - form validation handles them
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (_error) {
      // Error is handled by the mutation
      alert('Failed to delete team. Please try again.')
    }
  }

  const teams = data?.teams || []
  const mutationError = createMutation.error || updateMutation.error || deleteMutation.error

  return (
    <DashboardLayout>
      <div style={{ margin: '0 auto', maxWidth: '1200px' }}>
        {/* Header */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1 style={{ color: '#1f2937', margin: 0 }}>Teams</h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>{canEdit ? 'Manage your football teams' : 'View football teams'}</p>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleCreateClick}
              disabled={showForm}
              className="btn btn-primary"
              style={{
                opacity: showForm ? 0.5 : 1,
              }}
            >
              + Create Team
            </button>
          )}
        </div>

        {/* Form (conditional) - only for admins */}
        {showForm && canEdit && (
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
          onEdit={canEdit ? handleEditClick : undefined}
          onDelete={canEdit ? handleDelete : undefined}
          isLoading={isLoading}
          error={error}
        />

        {/* Stats Footer */}
        {!(isLoading || error) && (
          <div
            style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              marginTop: '2rem',
              padding: '1rem',
              textAlign: 'center',
            }}
          >
            Total teams: {data?.pagination.total || 0}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
