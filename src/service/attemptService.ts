import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { AnswerResult, AttemptAnswer } from "../entity/AttemptAnswer";
import { Attempt, AttemptMode, AttemptStatus } from "../entity/Attempt";
import { Exam } from "../entity/Exam";
import { ExamQuestion } from "../entity/ExamQuestion";
import { Question, QuestionType } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";
import { AppError } from "../utils/appError";

export class AttemptService {
    private attemptRepository: Repository<Attempt>;
    private attemptAnswerRepository: Repository<AttemptAnswer>;
    private examRepository: Repository<Exam>;
    private examQuestionRepository: Repository<ExamQuestion>;
    private questionRepository: Repository<Question>;
    private questOptionRepository: Repository<QuestionOption>;

    constructor() {
        this.attemptRepository = AppDataSource.getRepository(Attempt);
        this.attemptAnswerRepository = AppDataSource.getRepository(AttemptAnswer);
        this.examRepository = AppDataSource.getRepository(Exam);
        this.examQuestionRepository = AppDataSource.getRepository(ExamQuestion);
        this.questionRepository = AppDataSource.getRepository(Question);
        this.questOptionRepository = AppDataSource.getRepository(QuestionOption);
    }

    private normalizeAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[|\n\r]+/g, " ")
            .replace(/[.,!?;:"'()]/g, "")
            .replace(/\s+/g, " ");
    }

    private async getProgress(attempt: Attempt) {
        const totalQuestions = attempt.examId
            ? await this.examQuestionRepository.count({ where: { examId: attempt.examId } })
            : 0;
        const answeredCount = await this.attemptAnswerRepository.count({
            where: { attemptId: attempt.id }
        });

        return {
            totalQuestions,
            answeredCount,
            remainingCount: Math.max(totalQuestions - answeredCount, 0),
            percent: totalQuestions > 0
                ? Number(((answeredCount / totalQuestions) * 100).toFixed(2))
                : 0
        };
    }

    private toQuestionForAttempt(question: Question) {
        return {
            id: question.id,
            type: question.type,
            content: question.content,
            audioUrl: question.audioUrl,
            audioFileName: question.audioFileName,
            audioDuration: question.audioDuration,
            transcript: question.showTranscript ? question.transcript : undefined,
            showTranscript: question.showTranscript,
            options: question.options?.map((option) => ({
                id: option.id,
                questionId: option.questionId,
                label: option.label,
                content: option.content
            })) ?? []
        };
    }

    async startExam(userId: string, examId: number) {
        const exam = await this.examRepository.findOne({
            where: { id: examId, isActive: true },
            relations: {
                examQuestions: {
                    question: {
                        options: true
                    }
                }
            },
            order: {
                examQuestions: {
                    orderIndex: "ASC"
                }
            }
        });

        if (!exam) throw new AppError("Exam not found", 404);

        const existingAttempt = await this.attemptRepository.findOne({
            where: { userId, examId, status: AttemptStatus.IN_PROGRESS }
        });

        if (existingAttempt) {
            const answers = await this.attemptAnswerRepository.find({
                where: { attemptId: existingAttempt.id }
            });

            return {
                attempt: existingAttempt,
                questions: exam.examQuestions.map(eq => this.toQuestionForAttempt(eq.question)),
                answers,
                progress: await this.getProgress(existingAttempt)
            };
        }

        const attempt = await this.attemptRepository.save(
            this.attemptRepository.create({
                userId,
                examId,
                mode: AttemptMode.PRACTICE,
                status: AttemptStatus.IN_PROGRESS,
                startedAt: new Date()
            })
        );

        return {
            attempt,
            questions: exam.examQuestions.map(eq => this.toQuestionForAttempt(eq.question)),
            answers: [],
            progress: await this.getProgress(attempt)
        };
    }

    async answerQuestion(attemptId: number, questionId: number, selectedOptionId: number) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId }
        });

        if (!attempt) {
            throw new AppError("Khong tim thay lan lam bai", 404);
        }
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Bai thi khong con o trang thai lam bai", 400);
        }

        const option = await this.questOptionRepository.findOne({
            where: { id: selectedOptionId, questionId },
            relations: {
                question: true
            }
        });
        if (!option) {
            throw new AppError("Khong co cau hoi va dap an nay", 404);
        }

        const correctOption = await this.questOptionRepository.findOne({
            where: { questionId, isCorrect: true }
        });
        const existing = await this.attemptAnswerRepository.findOne({
            where: { attemptId, questionId }
        });
        const result = option.isCorrect ? AnswerResult.CORRECT : AnswerResult.WRONG;
        const answer = existing ?? this.attemptAnswerRepository.create({ attemptId, questionId });

        answer.selectedOptionId = Number(selectedOptionId);
        answer.result = result;
        answer.answeredAt = new Date();
        answer.correctOptionId = correctOption?.id;
        answer.answerText = null;
        answer.correctAnswerText = null;

        const savedAnswer = await this.attemptAnswerRepository.save(answer);

        return {
            answer: savedAnswer,
            isCorrect: result === AnswerResult.CORRECT,
            correctOptionId: correctOption?.id,
            explanation: option.question?.explanation,
            progress: await this.getProgress(attempt)
        };
    }

    async answerDictation(attemptId: number, questionId: number, answerText: string) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId }
        });

        if (!attempt) {
            throw new AppError("Khong tim thay lan lam bai", 404);
        }
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Bai thi khong con o trang thai lam bai", 400);
        }

        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });
        if (!question || question.type !== QuestionType.DICTATION) {
            throw new AppError("Khong co cau hoi nghe chep chinh ta nay", 404);
        }
        if (!question.dictationAnswer) {
            throw new AppError("Cau hoi nay chua co dap an dung", 400);
        }

        const result = this.normalizeAnswer(answerText) === this.normalizeAnswer(question.dictationAnswer)
            ? AnswerResult.CORRECT
            : AnswerResult.WRONG;
        const existing = await this.attemptAnswerRepository.findOne({
            where: { attemptId, questionId }
        });
        const answer = existing ?? this.attemptAnswerRepository.create({
            attemptId,
            questionId,
            selectedOptionId: null
        });

        answer.answerText = answerText;
        answer.correctAnswerText = question.dictationAnswer;
        answer.selectedOptionId = null;
        answer.correctOptionId = null;
        answer.result = result;
        answer.answeredAt = new Date();

        const savedAnswer = await this.attemptAnswerRepository.save(answer);

        return {
            answer: savedAnswer,
            isCorrect: result === AnswerResult.CORRECT,
            correctAnswerText: question.dictationAnswer,
            explanation: question.explanation,
            progress: await this.getProgress(attempt)
        };
    }

    async submitExam(attemptId: number, userId: string, examId: number) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, userId, examId }
        });
        if (!attempt) {
            throw new AppError("Ko co lan thi nay", 404);
        }
        if (attempt.status === AttemptStatus.SUBMITTED) {
            throw new AppError("Bai thi da nop roi", 400);
        }

        const exam = await this.examRepository.findOne({
            where: { id: examId },
            relations: { examQuestions: true }
        });
        if (!exam) throw new AppError("Khong tim thay de thi", 404);

        const totalQuestions = exam.examQuestions.length;
        const answers = await this.attemptAnswerRepository.find({
            where: { attemptId }
        });
        const correctCount = answers.filter(
            (item) => item.result === AnswerResult.CORRECT
        ).length;
        const wrongCount = answers.filter(
            (item) => item.result === AnswerResult.WRONG
        ).length;
        const score = totalQuestions > 0
            ? Number(((correctCount / totalQuestions) * 10).toFixed(2))
            : 0;

        attempt.status = AttemptStatus.SUBMITTED;
        attempt.score = score;
        attempt.totalQuestions = totalQuestions;
        attempt.correctCount = correctCount;
        attempt.submittedAt = new Date();

        const savedAttempt = await this.attemptRepository.save(attempt);
        const detailedAnswers = await this.attemptAnswerRepository.find({
            where: { attemptId },
            relations: {
                question: {
                    options: true
                },
                selectedOption: true
            }
        });

        return {
            attempt: savedAttempt,
            summary: {
                totalQuestions,
                answeredCount: answers.length,
                correctCount,
                wrongCount,
                unansweredCount: Math.max(totalQuestions - answers.length, 0),
                score
            },
            answers: detailedAnswers.map((item) => ({
                questionId: item.questionId,
                questionType: item.question?.type,
                content: item.question?.content,
                selectedOptionId: item.selectedOptionId,
                selectedOption: item.selectedOption,
                answerText: item.answerText,
                correctOptionId: item.correctOptionId,
                correctAnswerText: item.correctAnswerText,
                result: item.result,
                explanation: item.question?.explanation
            }))
        };
    }
}
