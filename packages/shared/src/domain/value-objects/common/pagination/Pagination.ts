import type { PaginationDTO } from '@dtos/pagination.dto'
import { ValidationError } from '@errors/ValidationError'
import { Err, Ok, type Result } from '@result'
import { type PaginationInput, PaginationSchema } from '@value-objects/common/pagination/Pagination.schema.js'
import { PAGINATION_RULES } from './Pagination.rules.js'
import type { PaginationPrimitives, PaginationProps } from './Paginations.types.js'

export class Pagination {
  readonly page: number
  readonly limit: number
  readonly total: number

  private constructor(props: PaginationProps) {
    this.page = props.page
    this.limit = props.limit
    this.total = props.total
  }

  static create(input: PaginationInput): Result<Pagination, ValidationError> {
    const validation = PaginationSchema.safeParse(input)

    if (!validation.success) {
      return Err(ValidationError.fromZodError({ error: validation.error }))
    }

    return Ok(new Pagination(validation.data))
  }

  static fromDTO(dto: PaginationDTO): Result<Pagination, ValidationError> {
    return Pagination.create({
      limit: dto.limit,
      page: dto.page,
      total: dto.total,
    })
  }

  get totalPages(): number {
    if (this.limit <= 0) return PAGINATION_RULES.MIN_PAGE
    const pages = Math.ceil(this.total / this.limit)
    return pages > 0 ? pages : PAGINATION_RULES.MIN_PAGE
  }

  get hasNext(): boolean {
    return this.page < this.totalPages
  }

  get hasPrev(): boolean {
    return this.page > PAGINATION_RULES.MIN_PAGE
  }

  toDTO(): PaginationDTO {
    return {
      hasNext: this.hasNext,
      hasPrev: this.hasPrev,
      limit: this.limit,
      page: this.page,
      total: this.total,
      totalPages: this.totalPages,
    }
  }

  // Needed because getters are not serialized
  toJSON(): PaginationPrimitives {
    return {
      hasNext: this.hasNext,
      hasPrev: this.hasPrev,
      limit: this.limit,
      page: this.page,
      total: this.total,
      totalPages: this.totalPages,
    }
  }
}
