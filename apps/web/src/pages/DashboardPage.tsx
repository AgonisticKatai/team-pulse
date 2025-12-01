const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="font-bold text-4xl tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to TeamPulse</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="teams">
            <h3 className="font-semibold">Teams</h3>
            <p className="mt-2 text-muted-foreground text-sm">Manage your teams</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="users">
            <h3 className="font-semibold">Users</h3>
            <p className="mt-2 text-muted-foreground text-sm">Manage users</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm" data-testid="analytics">
            <h3 className="font-semibold">Analytics</h3>
            <p className="mt-2 text-muted-foreground text-sm">View statistics</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
