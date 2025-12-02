import { Router } from "express";
import { UserController } from "../controller/userController";
import { AuthController } from "../controller/authController";
import { ExamController } from "../controller/examController";
import { UserExamController } from "../controller/UserExamController";

const examRouter = Router();


examRouter.use(AuthController.protect);
// CREATE EXAM
examRouter.post("/create-exam", ExamController.createExams);
// GET ALL EXAM
examRouter.get("/get-all-exam", ExamController.getAllExams)
// GET EXAM BY ID
examRouter.get("/exam-by-id/:id", ExamController.getExamById)

// UPDATE EXAM
examRouter.patch("/update-exam/:id", ExamController.updateExam)
// DETELE EXAM
examRouter.patch("/delete-exam/:id", ExamController.deleteExam)

// ADD QUESTION TO EXAM
examRouter.post("/create-question/:id", ExamController.addQuestion)
// UPDATE QUESTION TO EXAM
examRouter.patch("/update-question/:id", ExamController.updateQuestion)
// DELETE QUESTION
examRouter.delete("/delete-question/:id", ExamController.deleteQuestion)
// GET QUESTION BY EXAMID
examRouter.get("/exams/:examId/questions", ExamController.getQuestionByExamID)


// ================ USER EXAM ROUTE =========================== //
examRouter.post("/exams/:examId/start", UserExamController.startExam)
examRouter.post("/attempts/:attemptId/answers", UserExamController.submitAnswer)
examRouter.post("/attempts/:attemptId/submit", UserExamController.submitExam)

// LAY KET QUA
examRouter.get("/attempts/:attemptId/result", UserExamController.getExamResult)
export default examRouter;
