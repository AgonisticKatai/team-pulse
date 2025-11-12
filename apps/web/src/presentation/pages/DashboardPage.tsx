/**
 * Dashboard Page Component
 *
 * Main dashboard that shows role-specific content:
 * - SUPER_ADMIN: Full system overview and controls
 * - ADMIN: Team and user management tools
 * - USER: Read-only team information
 */

import { useAuth } from '../../application/hooks/use-auth'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import './DashboardPage.css'

export function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="dashboard-page">
        {/* Welcome Section */}
        <div className="dashboard-welcome">
          <h1>Welcome back, {user.email.split('@')[0]}! 👋</h1>
          <p className="dashboard-subtitle">Your role: {user.role}</p>
        </div>

        {/* Role-specific content */}
        {user.role === 'SUPER_ADMIN' && <SuperAdminDashboard />}
        {user.role === 'ADMIN' && <AdminDashboard />}
        {user.role === 'USER' && <UserDashboard />}
      </div>
    </DashboardLayout>
  )
}
/**
 * Super Admin Dashboard
 * Full system access and controls
 */
function SuperAdminDashboard() {
  return (
    <div className="dashboard-content">
      <div className="card card-highlight">
        <h2>🔥 Super Admin Panel</h2>
        <p>You have full system access. Use this power wisely!</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <h3>User Management</h3>
          <p>Create and manage all users</p>
          <a href="/users" className="card-link">
            Manage Users →
          </a>
        </div>

        <div className="card">
          <div className="card-icon">⚽</div>
          <h3>Team Management</h3>
          <p>Full control over all teams</p>
          <a href="/teams" className="card-link">
            Manage Teams →
          </a>
        </div>

        <div className="card">
          <div className="card-icon">📊</div>
          <h3>Analytics</h3>
          <p>System-wide statistics</p>
          <span className="card-badge">Coming Soon</span>
        </div>

        <div className="card">
          <div className="card-icon">⚙️</div>
          <h3>System Settings</h3>
          <p>Configure system parameters</p>
          <span className="card-badge">Coming Soon</span>
        </div>
      </div>

      <div className="info-box info-warning">
        <strong>⚠️ Important:</strong> As a Super Admin, all your actions are logged and audited.
      </div>
    </div>
  )
}

/**
 * Admin Dashboard
 * Team and user management
 */
function AdminDashboard() {
  return (
    <div className="dashboard-content">
      <div className="card card-highlight">
        <h2>🛠️ Admin Panel</h2>
        <p>Manage teams and users in your organization</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-icon">👥</div>
          <h3>User Management</h3>
          <p>Create and manage users</p>
          <a href="/users" className="card-link">
            Manage Users →
          </a>
        </div>

        <div className="card">
          <div className="card-icon">⚽</div>
          <h3>Team Management</h3>
          <p>Create and edit teams</p>
          <a href="/teams" className="card-link">
            Manage Teams →
          </a>
        </div>

        <div className="card">
          <div className="card-icon">📊</div>
          <h3>Reports</h3>
          <p>View team statistics</p>
          <span className="card-badge">Coming Soon</span>
        </div>
      </div>

      <div className="info-box info-info">
        <strong>💡 Tip:</strong> You can create new teams and users, but cannot delete system users.
      </div>
    </div>
  )
}

/**
 * User Dashboard
 * Read-only view
 */
function UserDashboard() {
  return (
    <div className="dashboard-content">
      <div className="card card-highlight">
        <h2>📖 User Dashboard</h2>
        <p>View team information and statistics</p>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-icon">⚽</div>
          <h3>View Teams</h3>
          <p>Browse all teams</p>
          <a href="/teams" className="card-link">
            View Teams →
          </a>
        </div>

        <div className="card">
          <div className="card-icon">📊</div>
          <h3>Statistics</h3>
          <p>View team performance</p>
          <span className="card-badge">Coming Soon</span>
        </div>

        <div className="card">
          <div className="card-icon">📅</div>
          <h3>Matches</h3>
          <p>View match schedules</p>
          <span className="card-badge">Coming Soon</span>
        </div>
      </div>

      <div className="info-box info-info">
        <strong>ℹ️ Note:</strong> You have read-only access. Contact an admin to make changes.
      </div>
    </div>
  )
}
