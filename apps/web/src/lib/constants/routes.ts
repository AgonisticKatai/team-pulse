/**
 * Route Constants
 *
 * Centralized route definitions for type-safe navigation.
 * Use these constants instead of hardcoded strings.
 */
export const ROUTES = {
  DASHBOARD: '/dashboard',
  HOME: '/',
  LOGIN: '/login',
  NOT_FOUND: '/404',
  TEAMS: '/teams',
  USERS: '/users',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = (typeof ROUTES)[RouteKey]
