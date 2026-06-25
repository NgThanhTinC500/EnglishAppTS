import { Router } from "express";
import { askEnglishChatbot } from "../controller/englishChatController";

const englishChatRouter = Router();

englishChatRouter.post("/english-chat", askEnglishChatbot);

export default englishChatRouter;
