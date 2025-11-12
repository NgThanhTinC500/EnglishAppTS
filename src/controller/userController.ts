import { Request, Response } from "express";
// import { AppDataSource } from "../data-source";
// import { User } from "../entity/User";
import { UserService } from "../service/userService";
import { userRepository } from "../repository/userRepository";

const userService = new UserService(userRepository);

export class UserController {
  static async all(req: Request, res: Response) {
    const users = await userService.findAll();
    res.status(200).json(users);
  }

  static async findOne(req: Request, res: Response) {
    const id = String(req.params.id);
    const user = await userService.findOne(id);
    res.status(200).json(user);
  }

  static async create(req: Request, res: Response) {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  }

  static async update(req: Request, res: Response) {
    const id = String(req.params.id);
    const updatedUser = await userService.updateUser(id, req.body);
    res.status(200).json(updatedUser);
  }

  static async delete(req: Request, res: Response) {
    const id = Number(req.params.id);
    const result = await userService.deleteUser(id);
    res.status(200).json(result);
  }
}
