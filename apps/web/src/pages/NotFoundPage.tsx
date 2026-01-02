import { ROUTES } from '@web/shared/constants/routes.js'
import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-bold text-9xl tracking-tight">404</h1>
        <p className="mt-4 font-semibold text-2xl">Page Not Found</p>
        <p className="oreground mt-2 text-muted-f">The page you're looking for doesn't exist.</p>

        <Link
          className="mt-8 inline-flex items-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow-sm transition-colors hover:bg-primary/90"
          to={ROUTES.DASHBOARD}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
