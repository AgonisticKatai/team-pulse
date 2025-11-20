import type { TeamResponseDTO } from '@team-pulse/shared/dtos'
import { TeamCard } from './TeamCard'

/**
 * Team List Props
 */
export interface TeamListProps {
  teams: TeamResponseDTO[]
  onEdit?: (team: TeamResponseDTO) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
  error?: Error | null
}

/**
 * Team List Component (Presentation Layer)
 *
 * Pure presentational component that displays a list of teams.
 * Handles loading and error states gracefully.
 */
export function TeamList({ teams, onEdit, onDelete, isLoading, error }: TeamListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>
        <p>Loading teams...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          color: '#f44336',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <p>
          <strong>Error loading teams:</strong>
        </p>
        <p>{error.message}</p>
      </div>
    )
  }

  // Empty state
  if (teams.length === 0) {
    return (
      <div style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>
        <p>No teams found. Create your first team!</p>
      </div>
    )
  }

  // Teams list
  return (
    <div
      style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      }}
    >
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
