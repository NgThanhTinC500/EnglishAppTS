import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { Repository } from "typeorm";
import { Question } from "../entity/Question";
import { Answer } from "../entity/Answer";

export class ExamService {
    private examRepository: Repository<Exam>;
    private questionRepository: Repository<Question>
    private answerRepository: Repository<Answer>
    constructor() {
        this.examRepository = AppDataSource.getRepository(Exam);
        this.questionRepository = AppDataSource.getRepository(Question);
        this.answerRepository = AppDataSource.getRepository(Answer);
    }

    // Partial
    // tham số examData chứa một phần field của entity Exam
    async createExam(examData: Partial<Exam>) {
        const exam = this.examRepository.create(examData);
        return this.examRepository.save(exam);
    }

    async getAllExams() {
        return await this.examRepository.find({
            where: { isActive: true },
            // relations: ["questions", "questions.answers"],
        });
    }

    // Service
    async getExamById(examId: number): Promise<Exam | null> {
        const exam = await this.examRepository.findOne({
            where: { id: examId },
            relations: ["questions", "questions.answers"],
        });
        return exam
    }

    async deleteExam(id: string) {
        const result = await this.examRepository.update(id, { isActive: false });
        return result
    }

    async updateExam(examId: number, updateData: Partial<Exam>) {
        const exam = await this.examRepository.findOne({
            where: { id: examId }
        });
        if (!exam) {
            return null;
        }
        // copy từ updateData vào exam
        Object.assign(exam, updateData);
        return await this.examRepository.save(exam);
    }

    // CREATE QUESTION
    async addQuestion(questionData: {
        examId: number;
        questionText: string;
        orderNumber: number;
        explanation?: string;
        answers: Array<{
            answerText: string;
            option: string;
            isCorrect: boolean;
        }>;
    }): Promise<Question> {
        // 1. Lấy exam
        const exam = await this.examRepository.findOne({
            where: { id: questionData.examId }
        });

        if (!exam) {
            throw new Error("Exam not found");
        }

        // 2. Tạo question
        const question = this.questionRepository.create({
            examId: questionData.examId,
            orderNumber: questionData.orderNumber,
            questionText: questionData.questionText,
            explanation: questionData.explanation
        });

        // 3. Lưu question
        const savedQuestion = await this.questionRepository.save(question);

        // 4. Tạo đáp án
        // mình lấy đáp án từ phần req.body
        // duyệt qua từng phần tử trong mảng answers
        // với mỗi phần tử tạo 1 entity
        const answers = questionData.answers.map(ans =>
            this.answerRepository.create({
                questionId: savedQuestion.id,
                answerText: ans.answerText,
                option: ans.option,
                isCorrect: ans.isCorrect
            })
        );

        await this.answerRepository.save(answers);

        // 5. Load lại question vừa tạo với danh sách answers của nó
        return await this.questionRepository.findOne({
            where: { id: savedQuestion.id },
            relations: ["answers"]
        });
    }

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
            order: {
                questions: {
                    orderNumber: "ASC"
                }
            }
        });
    }


}
