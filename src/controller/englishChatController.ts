import { Request, Response } from "express";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import { askEnglishChat } from "../service/englishChatService";

export const askEnglishChatbot = catchAsync(
  async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (typeof message !== "string") {
      throw new AppError("Message phải là chuỗi.", 400);
    }

    const answer = await askEnglishChat(message, history);

    res.status(200).json({
      status: "success",
      data: { answer },
    });
  }
);
