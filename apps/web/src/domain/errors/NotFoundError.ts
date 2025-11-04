import { DomainError } from './DomainError'

/**
 * Not found error for missing entities
 */
export class NotFoundError extends DomainError {
  public readonly entityType?: string
  public readonly entityId?: string

  constructor(
    message: string,
    options?: {
      entityId?: string
      entityType?: string
    },
  ) {
    super(message, { isOperational: true })
    this.entityType = options?.entityType
    this.entityId = options?.entityId
  }

  /**
   * Factory method for entity not found
   */
  static entity(entityType: string, id: string): NotFoundError {
    return new NotFoundError(`${entityType} with id '${id}' not found`, {
      entityId: id,
      entityType,
    })
  }

  override toObject() {
    return {
      ...super.toObject(),
      entityId: this.entityId,
      entityType: this.entityType,
    }
  }
}
