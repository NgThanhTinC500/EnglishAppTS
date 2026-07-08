import { FindOptionsWhere, UpdateResult } from "typeorm";

import { AppDataSource } from "../data-source";
import { User, UserRole } from "../entity/User";
import { AppError } from "../utils/appError";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async createUser(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findAll() {
    return this.userRepository.find({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneWithPassword(id: string) {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id })
      .getOne();
  }

  async updateUser(id: string, data: Partial<User>) {
    const { name, photo } = data;
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }

    if (name) user.name = name;
    if (photo !== undefined) user.photo = photo;

    await this.userRepository.save(user);
    return this.findOne(id);
  }

  async deleteUser(id: string) {
    await this.userRepository.update(id, { isActive: false });
    return { message: "User deleted successfully" };
  }

  async toggleUserRole(id: string, currentAdminId: string) {
    if (id === currentAdminId) {
      throw new AppError("You cannot change your own role", 400);
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }

    user.role = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;

    return this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  async findOneBy(condition: FindOptionsWhere<User>) {
    return this.userRepository.findOne({ where: condition });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async saveNoReload(user: User): Promise<User> {
    return this.userRepository.save(user, { reload: false });
  }

  async saveResetToken(user: User): Promise<UpdateResult> {
    return this.userRepository.update(user.id, {
      passwordResetToken: user.passwordResetToken ?? null,
      passwordResetExpires: user.passwordResetExpires ?? null,
    });
  }
}
