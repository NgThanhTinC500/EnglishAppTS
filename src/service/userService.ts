import { UpdateResult } from "typeorm";
import { FindOptionsWhere } from "typeorm";
import { User } from "../entity/User";
import { AppDataSource } from "../data-source";
import { AppError } from "../utils/appError";

export class UserService {

  private userRepository = AppDataSource.getRepository(User);

  async createUser(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find({
      where: { isActive: true }
    });
  }

  async findOne(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneWithPassword(id: string) {
    return await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id })
      .getOne();
  }

  // async updateUser(id: string, data: Partial<User>) {
  //   await this.userRepository.update(id, data);
  //   return await this.findOne(id);
  // }

  // Partial: chỉ cần truyền một số trường cần cập nhật
  async updateUser(id: string, data: Partial<User>) {
    const { name } = data;
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new AppError("No user found with that ID", 404);
    }
    if (name) user.name = name;
    await this.userRepository.save(user);
    return await this.findOne(id);
  }

  async deleteUser(id: string) {
    await this.userRepository.update(id, { isActive: false });
    return { message: "User deleted successfully" };
  }

  async findByEmail(email: string) {
    return await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  // user.service.ts
  // lấy kiểu dữ liệu trong entity User
async findOneBy(condition: FindOptionsWhere<User>) {
  return await this.userRepository.findOne({ where: condition });
}

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
  // Mặc định, TypeORM sau khi save() sẽ gửi thêm một truy vấn SELECT để lấy bản ghi mới nhất từ DB (gọi là reload).
  // cần trả về user đã được cập nhật nhưng không cần reload lại từ DB
  async saveNoReload(user: User): Promise<User> {
    return await this.userRepository.save(user, { reload: false });
  }

  // chỉ cần cập nhật một số trường
  async saveResetToken(user: User): Promise<UpdateResult> {
    return await this.userRepository.update(user.id, {
      passwordResetToken: user.passwordResetToken,
      passwordResetExpires: user.passwordResetExpires,
    });
  }


}
