import type { TeamResponseDTO } from '@team-pulse/shared'

/**
 * Team Card Props
 */
export interface TeamCardProps {
  team: TeamResponseDTO
  onEdit?: (team: TeamResponseDTO) => void
  onDelete?: (id: string) => void
}

/**
 * Team Card Component (Presentation Layer)
 *
 * Pure presentational component that displays team information.
 * This component:
 * - Has NO business logic
 * - Receives data via props
 * - Emits events via callbacks
 * - Is easily testable
 * - Is reusable
 */
export function TeamCard({ team, onEdit, onDelete }: TeamCardProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(team)
    }
  }

  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete ${team.name}?`)) {
      onDelete(team.id)
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '1.5rem',
      }}
    >
      <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0' }}>{team.name}</h3>

      <div style={{ color: '#888', marginBottom: '1rem' }}>
        <p style={{ margin: '0.25rem 0' }}>
          <strong>City:</strong> {team.city}
        </p>
        {team.foundedYear && (
          <p style={{ margin: '0.25rem 0' }}>
            <strong>Founded:</strong> {team.foundedYear}
          </p>
        )}
        <p style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>
          <strong>Created:</strong> {new Date(team.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {onEdit && (
          <button type="button" onClick={handleEdit} className="team-card-button team-card-button-edit">
            Edit
          </button>
        )}
        {onDelete && (
          <button type="button" onClick={handleDelete} className="team-card-button team-card-button-delete">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
