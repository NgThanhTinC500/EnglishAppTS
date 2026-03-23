import { In, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Question } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";

import { Topic } from "../entity/Topic";
import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";

export class QuestionService {
    private questionRepository: Repository<Question>;
    private optionRepository: Repository<QuestionOption>;
    private topicRepository: Repository<Topic>;
    private examRepository: Repository<Exam>;
    private examQuestionRepository: Repository<ExamQuestion>;

    constructor() {
        this.questionRepository = AppDataSource.getRepository(Question);
        this.optionRepository = AppDataSource.getRepository(QuestionOption);
        this.topicRepository = AppDataSource.getRepository(Topic);
        this.examRepository = AppDataSource.getRepository(Exam);
        this.examQuestionRepository = AppDataSource.getRepository(ExamQuestion);
    }

    async createQuestion(data: {
        content: string;
        explanation?: string;
        options: {
            label: string;
            content: string;
            isCorrect: boolean;
        }[];
        examId?: number;
    }) {
        return AppDataSource.transaction(async (manager) => {
            const questionRepo = manager.getRepository(Question);
            const optionRepo = manager.getRepository(QuestionOption);

            // const topicRepo = manager.getRepository(Topic);
            const examRepo = manager.getRepository(Exam);
            const examQuestionRepo = manager.getRepository(ExamQuestion);

            // ===== VALIDATE =====
            if (!data.content || data.content.trim() === "") {
                throw new Error("Question content is required");
            }

            if (!data.options || data.options.length < 2) {
                throw new Error("At least 2 options required");
            }

            const correctCount = data.options.filter(o => o.isCorrect).length;
            if (correctCount !== 1) {
                throw new Error("Must have exactly 1 correct answer");
            }

            // ===== CREATE QUESTION =====
            const question = questionRepo.create({
                content: data.content.trim(),
                explanation: data.explanation || null,
            });

            const savedQuestion = await questionRepo.save(question);

            // ===== CREATE OPTIONS =====
            const options = data.options.map(opt =>
                optionRepo.create({
                    questionId: savedQuestion.id,
                    label: opt.label.toUpperCase(),
                    content: opt.content,
                    isCorrect: opt.isCorrect,
                })
            );

            await optionRepo.save(options);

            // ===== ADD TO EXAM (optional) =====
            if (data.examId) {
                const exam = await examRepo.findOne({
                    where: { id: data.examId }
                });

                if (!exam) {
                    throw new Error("Exam not found");
                }

                const last = await examQuestionRepo.findOne({
                    where: { examId: data.examId },
                    order: { orderIndex: "DESC" }
                });

                const orderIndex = last ? last.orderIndex + 1 : 1;

                const examQuestion = examQuestionRepo.create({
                    examId: data.examId,
                    questionId: savedQuestion.id,
                    orderIndex
                });

                await examQuestionRepo.save(examQuestion);
            }

            return {
                id: savedQuestion.id,
                content: savedQuestion.content,
                explanation: savedQuestion.explanation
            };
        });
    }
    async getAllQuestion() {
        const result = await this.questionRepository.find();
        return result;
    }

    async getQuestionDetail(questionId: number) {
        const result = await this.questionRepository.findOne({
            where: { id: questionId }
        })
        return result;
    }
}