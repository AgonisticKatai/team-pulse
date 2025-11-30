const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Welcome to TeamPulse</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Teams</h3>
            <p className="mt-2 text-sm text-muted-foreground">Manage your teams</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Users</h3>
            <p className="mt-2 text-sm text-muted-foreground">Manage users</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="font-semibold">Analytics</h3>
            <p className="mt-2 text-sm text-muted-foreground">View statistics</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
