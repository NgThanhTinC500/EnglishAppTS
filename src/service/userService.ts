import { Repository } from "typeorm";
import { FindOptionsWhere } from "typeorm";
import { User } from "../entity/User";
export class UserService {
  constructor(
    private readonly userRepository: Repository<User>
  ) { }

  async createUser(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async findAll() {
    return await this.userRepository.find();
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
  async updateUser(id: string, data: Partial<User>) {
    const { password, passwordConfirm } = data;
    console.log("================================")
    console.log(password)
    console.log(passwordConfirm)

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }
    if (password) user.password = password;
    if (passwordConfirm !== undefined) user.passwordConfirm = passwordConfirm;

    await this.userRepository.save(user);

    return await this.findOne(id);
  }


  async deleteUser(id: number) {
    await this.userRepository.delete(id);
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
  async findByCondition(condition: FindOptionsWhere<User>) {
    return await this.userRepository.findOne({ where: condition });
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
  async saveNoReload(user: User): Promise<User> {
    return await this.userRepository.save(user, { reload: false });
  }
  async saveResetToken(user: User) {
    return this.userRepository.update(user.id, {
      passwordResetToken: user.passwordResetToken,
      passwordResetExpires: user.passwordResetExpires,
    });
  }


}
