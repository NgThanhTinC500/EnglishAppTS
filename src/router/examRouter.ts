import { Router } from "express";
import { UserController } from "../controller/userController";
import { AuthController } from "../controller/authController";
import { ExamController } from "../controller/examController";
// import { UserExamController } from "../controller/UserExamController";
import { uploadAudioSingle } from "../middlewares/uploadAudio";
// import { HistoryController } from "../controller/historyController";
const examRouter = Router();

const examController = new ExamController();
const authController = new AuthController();

examRouter.use(authController.protect);


// CREATE EXAM
examRouter.post("/exams", examController.createExams);
// GET ALL EXAM
examRouter.get("/exams", examController.getAllExams)
// GET EXAM BY ID
examRouter.get("/exams/:id", examController.getExamById)
// UPDATE EXAM
examRouter.patch("/exams/:id", examController.updateExam)
// DETELE EXAM
examRouter.patch("/exams/:id/status", examController.deleteExam)


// examRouter.patch("/update-question/:id", examController.updateQuestion)
// // DELETE QUESTION
// examRouter.delete("/delete-question/:id", examController.deleteQuestion)
// // GET QUESTION BY EXAMID
// examRouter.get("/exams/:examId/questions", examController.getQuestionByExamID)


// LISTENING 
// examRouter.post("/:id/question/listening",uploadAudioSingle, examController.addListeningQuestion)
// examRouter.delete("/delete/listening/:id", examController.deleteQuestionListening)
// examRouter.patch("/update/listening/:id", uploadAudioSingle, examController.updateQuestionAudio)

// ================ USER EXAM ROUTE =========================== //
// examRouter.post("/exams/:examId/start", UserexamController.startExam)
// examRouter.post("/attempts/:attemptId/answers", UserexamController.submitAnswer)
// examRouter.post("/attempts/:attemptId/submit", UserexamController.submitExam)

// // LAY KET QUA
// examRouter.get("/attempts/:attemptId/result", UserexamController.getExamResult)
// examRouter.get("/history/:userId", HistoryController.getExamHistory);
export default examRouter;
