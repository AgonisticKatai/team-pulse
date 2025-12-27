import type { User } from '@domain/models/user/User.js'
import type { PaginationMetaDTO, UserResponseDTO, UsersListResponseDTO } from '@team-pulse/shared'

export class UserMapper {
  private constructor() {}

  static toDTO(user: User): UserResponseDTO {
    return {
      createdAt: user.createdAt.toISOString(),
      email: user.email.getValue(),
      id: user.id,
      role: user.role.getValue(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  static toDTOList(users: User[]): UserResponseDTO[] {
    return users.map((user) => UserMapper.toDTO(user))
  }

  static toPaginatedList(users: User[], pagination: PaginationMetaDTO): UsersListResponseDTO {
    return {
      data: UserMapper.toDTOList(users),
      meta: pagination,
    }
  }
}
