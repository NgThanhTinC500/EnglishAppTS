import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicExamPartController } from "../controller/toeicExamPartController";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicExamPartSchema,
    deleteToeicExamPartSchema,
    getToeicExamPartByIdSchema,
    getToeicExamPartsByExamSetSchema,
    updateToeicExamPartSchema,
} from "../schemas/toeicExamPart.schema";

const toeicExamPartRouter = Router();
const authController = new AuthController();
const toeicExamPartController = new ToeicExamPartController();


toeicExamPartRouter.get(
    "/exam-sets/:examSetId/parts",
    authController.protect,
    validateRequest(getToeicExamPartsByExamSetSchema),
    toeicExamPartController.getAllByExamSet
);
toeicExamPartRouter.post(
    "/exam-sets/:examSetId/parts",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(createToeicExamPartSchema),
    toeicExamPartController.create
);
toeicExamPartRouter.get(
    "/parts/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(getToeicExamPartByIdSchema),
    toeicExamPartController.getById
);
toeicExamPartRouter.patch(
    "/parts/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(updateToeicExamPartSchema),
    toeicExamPartController.update
);
toeicExamPartRouter.delete(
    "/parts/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(deleteToeicExamPartSchema),
    toeicExamPartController.softDelete
);

export default toeicExamPartRouter;
