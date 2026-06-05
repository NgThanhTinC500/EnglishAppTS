import { Router } from "express";
import { AuthController } from "../controller/authController";
import { ToeicCollectionController } from "../controller/toeicCollectionController";
import { validateRequest } from "../middlewares/validateRequest";
import {
    createToeicCollectionSchema,
    updateToeicCollectionSchema,
} from "../schemas/toeicCollection.schema";

const toeicCollectionRouter = Router();
const authController = new AuthController();
const toeicCollectionController = new ToeicCollectionController();


toeicCollectionRouter.get("/", toeicCollectionController.getAllToeicCollections);
toeicCollectionRouter.get("/:id", toeicCollectionController.getToeicCollectionById);
toeicCollectionRouter.post(
    "/",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(createToeicCollectionSchema),
    toeicCollectionController.createToeicCollection
);
toeicCollectionRouter.patch(
    "/:id",
    authController.protect,
    authController.restrictTo("admin"),
    validateRequest(updateToeicCollectionSchema),
    toeicCollectionController.updateToeicCollection
);
toeicCollectionRouter.delete(
    "/:id",
    authController.protect,
    authController.restrictTo("admin"),
    toeicCollectionController.deleteToeicCollection
);

export default toeicCollectionRouter;
