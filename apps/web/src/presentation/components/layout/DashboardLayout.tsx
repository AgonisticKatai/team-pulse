/**
 * Dashboard Layout Component
 *
 * Common layout for all authenticated pages with:
 * - Header with navigation
 * - User info and logout button
 * - Role-based navigation items
 * - Responsive sidebar (future)
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../application/hooks/use-auth'
import './DashboardLayout.css'

export interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  if (!user) return null

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-brand">
            <Link to="/">
              <h1>⚽ TeamPulse</h1>
            </Link>
          </div>

          <nav className="dashboard-nav">
            <Link to="/" className="nav-link">
              Dashboard
            </Link>
            <Link to="/teams" className="nav-link">
              Teams
            </Link>
            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <Link to="/users" className="nav-link">
                Users
              </Link>
            )}
          </nav>

          <div className="dashboard-user">
            <div className="user-info">
              <span className="user-email">{user.email}</span>
              <span className={`user-role role-${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-outline btn-sm">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard-main">{children}</main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>TeamPulse © 2025 - Built with React + TypeScript + Hexagonal Architecture</p>
      </footer>
    </div>
  )
}
