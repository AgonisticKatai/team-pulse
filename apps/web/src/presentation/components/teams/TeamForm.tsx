import type { CreateTeamDTO, UpdateTeamDTO } from '@team-pulse/shared/dtos'
import { type FormEvent, useState } from 'react'

/**
 * Team Form Props
 */
export interface TeamFormProps {
  initialData?: UpdateTeamDTO & { id?: string }
  onSubmit: (data: CreateTeamDTO | UpdateTeamDTO) => void
  onCancel?: () => void
  isSubmitting?: boolean
  error?: Error | null
}

/**
 * Team Form Component (Presentation Layer)
 *
 * Form component for creating/editing teams.
 * This component:
 * - Manages form state internally
 * - Validates input (basic HTML5 validation)
 * - Emits clean data via onSubmit callback
 * - Shows loading/error states
 */
export function TeamForm({ initialData, onSubmit, onCancel, isSubmitting, error }: TeamFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [city, setCity] = useState(initialData?.city || '')
  const [foundedYear, setFoundedYear] = useState(initialData?.foundedYear?.toString() || '')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const data: CreateTeamDTO = {
      city: city.trim(),
      foundedYear: foundedYear ? Number.parseInt(foundedYear, 10) : undefined,
      name: name.trim(),
    }

    onSubmit(data)
  }

  const isEdit = !!initialData?.id

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '1.5rem',
      }}
    >
      <h3 style={{ color: '#fff', marginTop: 0 }}>{isEdit ? 'Edit Team' : 'Create New Team'}</h3>

      {error && (
        <div
          style={{
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            color: '#c62828',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            padding: '0.75rem',
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="name"
          style={{
            color: '#ccc',
            display: 'block',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}
        >
          Team Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
          disabled={isSubmitting}
          style={{
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '1rem',
            padding: '0.5rem',
            width: '100%',
          }}
          placeholder="e.g., FC Barcelona"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="city"
          style={{
            color: '#ccc',
            display: 'block',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}
        >
          City *
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          minLength={1}
          maxLength={100}
          disabled={isSubmitting}
          style={{
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '1rem',
            padding: '0.5rem',
            width: '100%',
          }}
          placeholder="e.g., Barcelona"
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="foundedYear"
          style={{
            color: '#ccc',
            display: 'block',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}
        >
          Founded Year (optional)
        </label>
        <input
          id="foundedYear"
          type="number"
          value={foundedYear}
          onChange={(e) => setFoundedYear(e.target.value)}
          min={1800}
          max={new Date().getFullYear()}
          disabled={isSubmitting}
          style={{
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '1rem',
            padding: '0.5rem',
            width: '100%',
          }}
          placeholder="e.g., 1899"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !city.trim()}
          style={{
            backgroundColor: '#646cff',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            flex: 1,
            fontSize: '1rem',
            opacity: isSubmitting ? 0.7 : 1,
            padding: '0.75rem 1.5rem',
          }}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Team' : 'Create Team'}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              backgroundColor: '#555',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              flex: 1,
              fontSize: '1rem',
              padding: '0.75rem 1.5rem',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
