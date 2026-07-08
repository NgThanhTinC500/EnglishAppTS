import { Request, Response } from "express";

import { UserService } from "../service/userService";
import catchAsync from "../utils/catchAsync";

const userService = new UserService();

export class UserController {
  static async all(req: Request, res: Response) {
    const users = await userService.findAll();
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
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

  static async updateMe(req: Request, res: Response) {
    const payload = {
      ...req.body,
      ...(req.file
        ? {
            photo: req.file.path || req.file.filename,
          }
        : {}),
    };
    const updatedUser = await userService.updateUser(req.user.id, payload);
    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  }

  static async delete(req: Request, res: Response) {
    const id = String(req.params.id);
    const result = await userService.deleteUser(id);
    res.status(200).json(result);
  }

  static toggleRole = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const user = await userService.toggleUserRole(id, req.user.id);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  });
}
