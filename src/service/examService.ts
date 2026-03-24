import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { Repository } from "typeorm";
import { Question } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";
import * as fs from 'fs';
import * as path from 'path';
import { Topic } from "../entity/Topic";
import { AppError } from "../utils/appError";

export class ExamService {
    private examRepository = AppDataSource.getRepository(Exam);
    private questionRepository = AppDataSource.getRepository(Question);
    private answerRepository = AppDataSource.getRepository(QuestionOption);
    private topicRepository = AppDataSource.getRepository(Topic)
    // constructor() {
    //     this.examRepository =
    //     this.questionRepository
    //     this.answerRepository
    //     this.topicRepository
    // }

    // Partial
    // tham số examData chứa một phần field của entity Exam
    async createExam(topicId: number, examData: any) {
        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });
        if (!topic) throw new Error("Topic not found");

        const {
            title,
            description,
            totalQuestions,
            duration
        } = examData;

        const exam = this.examRepository.create({
            title,
            description,
            totalQuestions,
            duration,
            topicId
        });

        return this.examRepository.save(exam);
    }

    async getAllExams(topicId: number) {
        return await this.examRepository.find({
            where: { topicId: topicId, isActive: true },
            order: { createdAt: "DESC" }
            // relations: ["questions", "questions.answers"],
        });
    }

    // Service
    async getExamDetail(topicId: number, examId: number): Promise<Exam> {
        const exam = await this.examRepository.findOne({
            where: { topicId: topicId, id: examId },
            relations: {
                examQuestions: {
                    question: true
                }
            }
        });
        if (!exam) {
            throw new AppError("Ko co exam", 404)
        }
        return exam
    }

    async toggleExamActive(topicId: number, examId: number) {
        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId }
        });
        if (!exam) {
            throw new AppError("Ko co exam", 404);
        }
        exam.isActive = !exam.isActive;

        return await this.examRepository.save(exam);
    }

    async updateExam(topicId: number, examId: number, updateData: Partial<Exam>) {
        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId }
        });
        if (!exam) {
            throw new AppError("Ko co exam", 404);
        }
        const allowedFields = ["title", "description", "totalQuestions", "duration"];

        const filteredData = Object.fromEntries(
            // Object.entries(updateData) — chuyển object thành mảng [key, value]
            Object.entries(updateData).filter(([key]) =>
                allowedFields.includes(key)
            )
        );

        // copy từ updateData vào exam
        Object.assign(exam, filteredData);
        return await this.examRepository.save(exam);
    }

    // CREATE QUESTION
    // async addQuestion(questionData: {
    //     examId: number;
    //     questionText: string;
    //     // orderNumber: number;
    //     explanation?: string;
    //     answers: Array<{
    //         answerText: string;
    //         option: string;
    //         isCorrect: boolean;
    //     }>;
    // }): Promise<Question> {
    //     // 1. Lấy exam
    //     const exam = await this.examRepository.findOne({
    //         where: { id: questionData.examId }
    //     });

    //     if (!exam) {
    //         throw new Error("Exam not found");
    //     }

    //     // 2. Tạo question
    //     const question = this.questionRepository.create({
    //         examId: questionData.examId,
    //         // orderNumber: questionData.orderNumber,
    //         questionText: questionData.questionText,
    //         explanation: questionData.explanation
    //     });

    //     // 3. Lưu question
    //     const savedQuestion = await this.questionRepository.save(question);

    //     // 4. Tạo đáp án
    //     // mình lấy đáp án từ phần req.body
    //     // duyệt qua từng phần tử trong mảng answers
    //     // với mỗi phần tử tạo 1 entity
    //     // const answers = questionData.answers.map(ans =>
    //     //     this.answerRepository.create({
    //     //         questionId: savedQuestion.id,
    //     //         answerText: ans.answerText,
    //     //         option: ans.option,
    //     //         isCorrect: ans.isCorrect
    //     //     })
    //     // );

    //     await this.answerRepository.save(answers);

    //     // 5. Load lại question vừa tạo với danh sách answers của nó
    //     return await this.questionRepository.findOne({
    //         where: { id: savedQuestion.id },
    //         relations: ["answers"]
    //     });
    // }

    async updateQuestion(questionId: number, updateData: Partial<Question>) {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        })

        if (!question) {
            return null;
        }
        // copy từ updateData vào question
        Object.assign(question, updateData);
        return await this.questionRepository.save(question)
    }
    async deleteQuestion(questionId: number): Promise<boolean> {
        const result = await this.questionRepository.delete(questionId);
        // tra ve true neu co it nhat 1 dong dc update
        return result.affected > 0;
    }
    async getExamWithQuestions(examId: number): Promise<Exam | null> {
        return await this.examRepository.findOne({
            where: { id: examId },
            relations: ["questions", "questions.answers"],
            // order: {
            //     questions: {
            //         orderNumber: "ASC"
            //     }
            // }
        });
    }


    // Thêm câu hỏi listening với audio
    // async addListeningQuestion(questionData: {
    //     examId: number;
    //     questionText: string;
    //     // orderNumber: number;
    //     explanation?: string;
    //     audioUrl: string;
    //     audioFileName: string;
    //     // audioDuration?: number;
    //     transcript?: string;
    //     showTranscript?: boolean;
    //     answers: Array<{
    //         answerText: string;
    //         option: string;
    //         isCorrect: boolean;
    //     }>;
    // }): Promise<Question> {
    //     const exam = await this.examRepository.findOne({
    //         where: { id: questionData.examId }
    //     });

    //     if (!exam) {
    //         throw new Error("Exam not found");
    //     }

    //     // Tạo question với audio
    //     const question = this.questionRepository.create({
    //         examId: questionData.examId,
    //         questionText: questionData.questionText,
    //         // orderNumber: questionData.orderNumber,
    //         explanation: questionData.explanation,
    //         audioUrl: questionData.audioUrl,
    //         audioFileName: questionData.audioFileName,
    //         // audioDuration: questionData.audioDuration,
    //         transcript: questionData.transcript,
    //         showTranscript: questionData.showTranscript || false
    //     });

    //     const savedQuestion = await this.questionRepository.save(question);

    //     // Tạo các đáp án
    //     const answers = questionData.answers.map(ans =>
    //         this.answerRepository.create({
    //             questionId: savedQuestion.id,
    //             content: ans.content,
    //             option: ans.option,
    //             isCorrect: ans.isCorrect
    //         })
    //     );

    //     await this.answerRepository.save(answers);

    //     // Load lại câu hỏi với đáp án
    //     return await this.questionRepository.findOne({
    //         where: { id: savedQuestion.id },
    //         relations: ["answers"]
    //     });
    // }

    // Xóa câu hỏi (bao gồm xóa file audio nếu có)
    async deleteQuestionWithAudio(questionId: number): Promise<boolean> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question) {
            return false;
        }

        // Xóa file audio nếu có
        if (question.audioUrl) {
            try {
                const filePath = path.join(".", question.audioUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted audio file: ${filePath}`);
                }
            } catch (error) {
                console.error(`Failed to delete audio file: ${error}`);
            }
        }

        const result = await this.questionRepository.delete(questionId);
        return result.affected > 0;
    }
    async updateQuestionAudio(
        questionId: number,
        audioUrl: string,
        audioFileName: string,
        audioDuration?: number
    ): Promise<Question | null> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question) {
            return null;
        }

        // Xóa audio cũ nếu có
        if (question.audioUrl && question.audioUrl !== audioUrl) {
            try {
                const oldFilePath = path.join(".", question.audioUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (error) {
                console.error(`Failed to delete old audio: ${error}`);
            }
        }

        // Cập nhật audio mới
        question.audioUrl = audioUrl;
        question.audioFileName = audioFileName;
        question.audioDuration = audioDuration;

        return await this.questionRepository.save(question);
    }



}
