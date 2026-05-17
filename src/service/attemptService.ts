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

    private escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private buildMaskedTranscript(question: Question) {
        if (question.type !== QuestionType.DICTATION || !question.transcript || !question.dictationAnswer) {
            return undefined;
        }
        return question.transcript.replace(
            new RegExp(this.escapeRegExp(question.dictationAnswer), "i"),
            "[BLANK]"
        );
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
            maskedTranscript: this.buildMaskedTranscript(question),
            showTranscript: question.showTranscript,
            options: question.options?.map((option) => ({
                id: option.id,
                questionId: option.questionId,
                label: option.label,
                content: option.content
            })) ?? []
        };
    }

    // start a new attempt for an exam,
    //  or return existing in-progress attempt if exists
    async startExam(userId: string, examId: number) {
        // 1. Kiểm tra exam tồn tại
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

        // 2. Tìm hoặc tạo attempt
        const existingAttempt = await this.attemptRepository.findOne({
            where: { userId, examId, status: AttemptStatus.IN_PROGRESS }
        });

        // tạo attempt mới nếu chưa có attempt nào đang làm cho exam này,
        //  hoặc trả về attempt đang làm
        const attempt = existingAttempt ?? await this.attemptRepository.save(
            this.attemptRepository.create({
                userId,
                examId,
                mode: AttemptMode.PRACTICE,
                status: AttemptStatus.IN_PROGRESS,
                startedAt: new Date()
            })
        );

        // 3. Lấy các câu đã trả lời (nếu là attempt mới thì rỗng)
        const answeredQuestions = existingAttempt
            ? await this.attemptAnswerRepository.find({
                where: { attemptId: attempt.id }
            })
            : [];

        return {
            attempt,
            questions: exam.examQuestions.map(eq => this.toQuestionForAttempt(eq.question)),
            answeredQuestions,
        };
    }
    // answer a question in an attempt, 
    // create or update the corresponding AttemptAnswer record
    async answerQuestion(attemptId: number, questionId: number, selectedOptionId: number) {
        // 1. Kiểm tra attempt hợp lệ
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId }
        });
        if (!attempt) throw new AppError("Không tồn tại lần thi này", 404);
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Bài thi không còn ở trạng thái làm bài", 400);
        }

        // 2. Lấy tất cả options của câu hỏi — 1 query duy nhất
        const options = await this.questOptionRepository.find({
            where: { questionId }
        });

        // console.log(options)
        if (!options.length) throw new AppError("Câu hỏi không tồn tại", 404);

        // tìm option được chọn trong số options của câu hỏi
        const selectedOption = options.find(o => o.id === Number(selectedOptionId));
        if (!selectedOption) throw new AppError("Đáp án không thuộc câu hỏi này", 404);

        // tìm đáp án đúng
        const correctOption = options.find(o => o.isCorrect);

        // 3. Lưu hoặc cập nhật answer
        const existing = await this.attemptAnswerRepository.findOne({
            where: { attemptId, questionId }
        });
        // nếu chọn rồi thì cập nhật, chưa chọn thì tạo mới
        const answer = existing ?? this.attemptAnswerRepository.create({ attemptId, questionId });

        answer.selectedOptionId = Number(selectedOptionId);
        answer.result = selectedOption.isCorrect ? AnswerResult.CORRECT : AnswerResult.WRONG;
        answer.answeredAt = new Date();

        const savedAnswer = await this.attemptAnswerRepository.save(answer);

        // 4. Lấy explanation từ question
        const question = await this.questionRepository.findOne({
            where: { id: questionId },
            select: ['explanation', 'transcript']
        });

        return {
            answerId: savedAnswer.id,
            selectedOptionId: selectedOption.id,
            selectedOption: selectedOption
                ? { id: selectedOption.id, label: selectedOption.label, content: selectedOption.content }
                : null,
            isCorrect: selectedOption.isCorrect,
            correctOptionId: correctOption?.id ?? null,
            correctOption: correctOption
                ? { id: correctOption.id, label: correctOption.label, content: correctOption.content }
                : null,
            explanation: question?.explanation ?? null,
            transcript: question?.transcript ?? null,
        };
    }

    async answerDictation(attemptId: number, questionId: number, answerText: string) {
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId }
        });

        if (!attempt) {
            throw new AppError("Không tồn tại lần thi này", 404);
        }
        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new AppError("Bài thi không còn ở trạng thái làm bài", 400);
        }

        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });
        if (!question || question.type !== QuestionType.DICTATION) {
            throw new AppError("Không tồn tại câu hỏi nghe chép chính xác này", 404);
        }
        if (!question.dictationAnswer) {
            throw new AppError("Câu hỏi này chưa có đáp án đúng", 400);
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
            throw new AppError("Không tồn tại lần thi này", 404);
        }
        if (attempt.status === AttemptStatus.SUBMITTED) {
            throw new AppError("Bài thi đã nộp rồi", 400);
        }

        const exam = await this.examRepository.findOne({
            where: { id: examId },
            relations: { examQuestions: true }
        });
        if (!exam) throw new AppError("Không tìm thấy đề thi", 404);

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
                correctOptionId: item.question?.options?.find((option) => option.isCorrect)?.id ?? null,
                correctAnswerText: item.correctAnswerText,
                result: item.result,
                explanation: item.question?.explanation
            }))
        };
    }
}
