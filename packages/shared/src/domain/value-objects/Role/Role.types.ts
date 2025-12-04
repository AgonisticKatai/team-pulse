export const UserRoles = {
  Admin: 'ADMIN',
  SuperAdmin: 'SUPER_ADMIN',
  User: 'USER',
} as const

export type UserRoleType = (typeof UserRoles)[keyof typeof UserRoles]
