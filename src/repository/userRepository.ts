import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Exam } from "../entity/Exam";

export const userRepository = AppDataSource.getRepository(User);
export const examrRepository = AppDataSource.getRepository(Exam);