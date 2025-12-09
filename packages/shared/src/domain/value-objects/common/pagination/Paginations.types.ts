export type PaginationProps = {
  page: number
  limit: number
  total: number
}

export type PaginationPrimitives = {
  hasNext: boolean
  hasPrev: boolean
  limit: number
  page: number
  total: number
  totalPages: number
}
