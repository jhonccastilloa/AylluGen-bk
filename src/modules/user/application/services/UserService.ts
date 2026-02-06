import { injectable, inject } from "inversify";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { UserResponse, UpdateUserDTO } from "../schemas/user.schema";
import { NotFoundError } from "../../../../shared/errors/AppError";
import { UserMapper } from "../../../../shared/mappers/UserMapper";
import { TYPES } from "../../../../shared/di/types";

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
  ) {}

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuario no encontrado");
    return UserMapper.toResponse(user);
  }

  async getById(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Usuario no encontrado");
    return UserMapper.toResponse(user);
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await this.userRepository.update(id, data);
    return UserMapper.toResponse(user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}
