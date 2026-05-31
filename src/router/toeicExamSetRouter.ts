import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicExamSetController } from "../controller/toeicExamSetController";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicExamSetSchema,
    deleteToeicExamSetSchema,
    getToeicExamSetByIdSchema,
    getToeicExamSetsSchema,
    updateToeicExamSetSchema,
} from "../schemas/toeicExamSet.schema";

const toeicExamSetRouter = Router();
const authController = new AuthController();
const toeicExamSetController = new ToeicExamSetController();

toeicExamSetRouter.use(authController.protect);

toeicExamSetRouter.get(
    "/toeic/exam-sets/:id/full",
    toeicExamSetController.getFull
);
toeicExamSetRouter.post(
    "/toeic/exam-sets/:id/validate",
    authController.restrictTo("admin"),
    toeicExamSetController.validate
);
toeicExamSetRouter.patch(
    "/toeic/exam-sets/:id/publish",
    authController.restrictTo("admin"),
    toeicExamSetController.publish
);

toeicExamSetRouter.get(
    "/toeic-collections/:collectionId/exam-sets",
    validateRequest(getToeicExamSetsSchema),
    toeicExamSetController.getAll
);
toeicExamSetRouter.get(
    "/toeic-collections/:collectionId/exam-sets/:id",
    validateRequest(getToeicExamSetByIdSchema),
    toeicExamSetController.getById
);
toeicExamSetRouter.post(
    "/toeic-collections/:collectionId/exam-sets",
    authController.restrictTo("admin"),
    validateRequest(createToeicExamSetSchema),
    toeicExamSetController.create
);
toeicExamSetRouter.patch(
    "/toeic-collections/:collectionId/exam-sets/:id",
    authController.restrictTo("admin"),
    validateRequest(updateToeicExamSetSchema),
    toeicExamSetController.update
);
toeicExamSetRouter.delete(
    "/toeic-collections/:collectionId/exam-sets/:id",
    authController.restrictTo("admin"),
    validateRequest(deleteToeicExamSetSchema),
    toeicExamSetController.softDelete
);

export default toeicExamSetRouter;
