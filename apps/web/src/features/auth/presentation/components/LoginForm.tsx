import { useLogin } from '@web/features/auth/index.js'
import { Button } from '@web/shared/design-system/index.js'
import type { FormEvent } from 'react'
import { useState } from 'react'

/**
 * Login Form Component
 *
 * Handles user authentication with email and password
 * Uses React Query mutation for async state management
 */
export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { mutate: login, isPending, isError, error } = useLogin()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    login(
      { email, password },
      {
        onSuccess: () => {
          // TODO: Handle successful login (store tokens, redirect, etc.)
        },
      },
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending}
          id="email"
          onChange={(e) => setEmail(e.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          disabled={isPending}
          id="password"
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {isError && error && <div className="bg-destructive/10 p-3 text-destructive text-sm">{error.message}</div>}

      <Button disabled={isPending} type="submit">
        {isPending ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  )
}
