export const TEAM_FOUNDED_YEAR_RULES = {
  get currentMaxYear(): number {
    return new Date().getFullYear()
  },
  MIN: 1850,
} as const
