/**
 * Route Constants
 *
 * Centralized route definitions for type-safe navigation.
 * Use these constants instead of hardcoded strings.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  TEAMS: '/teams',
  USERS: '/users',
  NOT_FOUND: '/404',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]
