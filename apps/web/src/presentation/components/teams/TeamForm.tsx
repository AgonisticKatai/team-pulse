import type { CreateTeamDTO, UpdateTeamDTO } from '@team-pulse/shared'
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
      name: name.trim(),
      city: city.trim(),
      foundedYear: foundedYear ? Number.parseInt(foundedYear, 10) : undefined,
    }

    onSubmit(data)
  }

  const isEdit = !!initialData?.id

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '1.5rem',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
      }}
    >
      <h3 style={{ marginTop: 0, color: '#fff' }}>{isEdit ? 'Edit Team' : 'Create New Team'}</h3>

      {error && (
        <div
          style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="name"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#ccc',
            fontSize: '0.875rem',
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
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #444',
            borderRadius: '4px',
            backgroundColor: '#2a2a2a',
            color: '#fff',
          }}
          placeholder="e.g., FC Barcelona"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          htmlFor="city"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#ccc',
            fontSize: '0.875rem',
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
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #444',
            borderRadius: '4px',
            backgroundColor: '#2a2a2a',
            color: '#fff',
          }}
          placeholder="e.g., Barcelona"
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="foundedYear"
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#ccc',
            fontSize: '0.875rem',
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
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #444',
            borderRadius: '4px',
            backgroundColor: '#2a2a2a',
            color: '#fff',
          }}
          placeholder="e.g., 1899"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim() || !city.trim()}
          style={{
            flex: 1,
            padding: '0.75rem 1.5rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            opacity: isSubmitting ? 0.7 : 1,
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
              flex: 1,
              padding: '0.75rem 1.5rem',
              backgroundColor: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
