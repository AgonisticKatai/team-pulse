import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-9xl font-bold tracking-tight">404</h1>
        <p className="mt-4 text-2xl font-semibold">Page Not Found</p>
        <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>

        <Link
          to={ROUTES.DASHBOARD}
          className="mt-8 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
