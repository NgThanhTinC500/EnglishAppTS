import { In, LessThanOrEqual, Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicExamPart } from "../entity/ToeicExamPart";
import { ToeicExamSession, ToeicSessionStatus } from "../entity/ToeicExamSession";
import { ToeicExamSet } from "../entity/ToeicExamSet";
import { ToeicQuestion } from "../entity/ToeicQuestion";
import { ToeicQuestionOption } from "../entity/ToeicQuestionOption";
import { ToeicSessionAnswer } from "../entity/ToeicSessionAnswer";
import { AppError } from "../utils/appError";
import { ToeicExamSetService } from "./toeicExamSetService";

const TOEIC_DURATION_SECONDS = 120 * 60;
const TOEIC_TOTAL_QUESTIONS = 200;
const LISTENING_PARTS = new Set([1, 2, 3, 4]);
const READING_PARTS = new Set([5, 6, 7]);

interface SubmitAnswerInput {
    questionId: number;
    selectedOptionId: number | null;
    timeSpentSeconds?: number;
}

export class ToeicExamSessionService {
    private sessionRepository: Repository<ToeicExamSession>;
    private sessionAnswerRepository: Repository<ToeicSessionAnswer>;
    private examSetRepository: Repository<ToeicExamSet>;
    private optionRepository: Repository<ToeicQuestionOption>;
    private toeicExamSetService = new ToeicExamSetService();

    constructor() {
        this.sessionRepository = AppDataSource.getRepository(ToeicExamSession);
        this.sessionAnswerRepository = AppDataSource.getRepository(ToeicSessionAnswer);
        this.examSetRepository = AppDataSource.getRepository(ToeicExamSet);
        this.optionRepository = AppDataSource.getRepository(ToeicQuestionOption);
    }

    async expireOverdueSessions(now = new Date()) {
        const expiresBefore = new Date(now.getTime() - TOEIC_DURATION_SECONDS * 1000);
        const result = await this.sessionRepository.update(
            {
                status: ToeicSessionStatus.IN_PROGRESS,
                startedAt: LessThanOrEqual(expiresBefore),
            },
            {
                status: ToeicSessionStatus.EXPIRED,
                remainingSeconds: 0,
            }
        );

        return result.affected ?? 0;
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private getElapsedSeconds(session: ToeicExamSession) {
        if (!session.startedAt) return 0;
        return Math.max(0, Math.floor((Date.now() - session.startedAt.getTime()) / 1000));
    }

    private getRemainingSeconds(session: ToeicExamSession) {
        if (session.status === ToeicSessionStatus.SUBMITTED) {
            return Math.max(0, session.remainingSeconds ?? 0);
        }

        return Math.max(TOEIC_DURATION_SECONDS - this.getElapsedSeconds(session), 0);
    }

    private async applyTimer(session: ToeicExamSession) {
        if (session.status !== ToeicSessionStatus.IN_PROGRESS) return session;

        const remainingSeconds = this.getRemainingSeconds(session);
        session.remainingSeconds = remainingSeconds;

        if (remainingSeconds <= 0) {
            session.status = ToeicSessionStatus.EXPIRED;
        }

        return this.sessionRepository.save(session);
    }

    private async getSessionForUser(sessionId: number, userId: string) {
        this.ensurePositiveInteger(sessionId, "sessionId");

        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) throw new AppError("TOEIC session not found", 404);

        return session;
    }

    private async getFullExamSetEntity(examSetId: number, requirePublished = true) {
        this.ensurePositiveInteger(examSetId, "examSetId");

        const examSet = await this.examSetRepository.findOne({
            where: requirePublished ? { id: examSetId, isPublished: true } : { id: examSetId },
            relations: {
                parts: {
                    questionGroups: {
                        images: true,
                        questions: {
                            options: true,
                        },
                    },
                },
            },
            order: {
                parts: {
                    partNumber: "ASC",
                    questionGroups: {
                        groupOrder: "ASC",
                        images: {
                            imageOrder: "ASC",
                        },
                        questions: {
                            questionNumber: "ASC",
                            options: {
                                optionLabel: "ASC",
                            },
                        },
                    },
                },
            },
        });

        if (!examSet) throw new AppError("TOEIC exam set not found", 404);

        return examSet;
    }

    private getQuestionsById(parts: ToeicExamPart[]) {
        const questionsById = new Map<number, { question: ToeicQuestion; partNumber: number }>();

        parts.forEach((part) => {
            part.questionGroups?.forEach((group) => {
                group.questions?.forEach((question) => {
                    questionsById.set(question.id, {
                        question,
                        partNumber: part.partNumber,
                    });
                });
            });
        });

        return questionsById;
    }

    private getQuestionIds(parts: ToeicExamPart[]) {
        return [...this.getQuestionsById(parts).keys()];
    }

    private toPublicExamSet(examSetId: number) {
        return this.toeicExamSetService.getFull(examSetId, {
            includeCorrect: false,
            requirePublished: true,
        });
    }

    private toAnswerPayload(answer: ToeicSessionAnswer, includeCorrect: boolean) {
        return {
            id: answer.id,
            sessionId: answer.sessionId,
            questionId: answer.questionId,
            selectedOptionId: answer.selectedOptionId,
            isCorrect: includeCorrect ? answer.isCorrect : undefined,
            answeredAt: answer.answeredAt,
            timeSpentSeconds: answer.timeSpentSeconds,
        };
    }

    private scaleToeicScore(correctCount: number, maxCount: number) {
        if (maxCount <= 0) return 0;
        if (correctCount <= 0) return 0;

        const rawScore = Math.round(((correctCount / maxCount) * 495) / 5) * 5;
        return Math.min(495, Math.max(5, rawScore));
    }

    private async getSessionAnswers(sessionId: number) {
        return this.sessionAnswerRepository.find({
            where: { sessionId },
            order: { questionId: "ASC" },
        });
    }

    private formatDuration(seconds: number) {
        const normalizedSeconds = Math.max(0, Math.floor(seconds));
        const h = Math.floor(normalizedSeconds / 3600);
        const m = Math.floor((normalizedSeconds % 3600) / 60);
        const s = normalizedSeconds % 60;

        return `${h.toString().padStart(2, "0")}:` +
            `${m.toString().padStart(2, "0")}:` +
            `${s.toString().padStart(2, "0")}`;
    }

    private getTimeSpentSeconds(session: ToeicExamSession) {
        if (!session.startedAt) return 0;
        const endTime = session.submittedAt?.getTime() ?? Date.now();
        return Math.min(
            TOEIC_DURATION_SECONDS,
            Math.max(0, Math.floor((endTime - session.startedAt.getTime()) / 1000))
        );
    }

    private buildQuestionResults(
        questionById: Map<number, { question: ToeicQuestion; partNumber: number }>,
        answers: ToeicSessionAnswer[]
    ) {
        const answersByQuestionId = new Map(
            answers.map((answer) => [answer.questionId, answer])
        );

        return [...questionById.entries()]
            .sort(([, first], [, second]) => first.question.questionNumber - second.question.questionNumber)
            .map(([questionId, entry]) => {
                const answer = answersByQuestionId.get(questionId);

                return {
                    questionId,
                    questionNumber: entry.question.questionNumber,
                    partNumber: entry.partNumber,
                    selectedOptionId: answer?.selectedOptionId ?? null,
                    correctOptionId: entry.question.correctOptionId,
                    isCorrect: answer?.isCorrect ?? false,
                    answeredAt: answer?.answeredAt ?? null,
                    timeSpentSeconds: answer?.timeSpentSeconds ?? 0,
                };
            });
    }
    private async saveAnswer(
        session: ToeicExamSession,
        questionById: Map<number, { question: ToeicQuestion; partNumber: number }>,
        questionId: number,
        selectedOptionId: number,
        timeSpentSeconds = 0
    ) {
        this.ensurePositiveInteger(questionId, "questionId");
        this.ensurePositiveInteger(selectedOptionId, "selectedOptionId");

        if (this.getRemainingSeconds(session) <= 0) {
            session.remainingSeconds = 0;
            session.status = ToeicSessionStatus.EXPIRED;
            await this.sessionRepository.save(session);
            throw new AppError("TOEIC session has expired", 400);
        }

        const questionEntry = questionById.get(questionId);
        if (!questionEntry) {
            throw new AppError("Question does not belong to this TOEIC session", 400);
        }

        const option = await this.optionRepository.findOne({
            where: {
                id: selectedOptionId,
                questionId,
            },
        });

        if (!option) throw new AppError("Selected option does not belong to this question", 400);

        await this.sessionAnswerRepository.upsert({
            sessionId: session.id,
            questionId,
            selectedOptionId,
            isCorrect: option.isCorrect,
            answeredAt: new Date(),
            timeSpentSeconds: Math.max(0, Number(timeSpentSeconds) || 0),
        }, ["sessionId", "questionId"]);

        session.currentPartNumber = questionEntry.partNumber;
        session.currentQuestionId = questionId;
        session.remainingSeconds = this.getRemainingSeconds(session);
        await this.sessionRepository.save(session);
    }

    private async buildSubmittedPayload(session: ToeicExamSession, examSet: ToeicExamSet) {
        const questionById = this.getQuestionsById(examSet.parts ?? []);
        const allQuestionIds = [...questionById.keys()];
        const savedAnswers = allQuestionIds.length
            ? await this.sessionAnswerRepository.find({
                where: {
                    sessionId: session.id,
                    questionId: In(allQuestionIds),
                },
                order: { questionId: "ASC" },
            })
            : [];

        let listeningCorrectCount = 0;
        let readingCorrectCount = 0;

        savedAnswers.forEach((answer) => {
            if (!answer.isCorrect) return;

            const partNumber = questionById.get(answer.questionId)?.partNumber;
            if (partNumber && LISTENING_PARTS.has(partNumber)) listeningCorrectCount++;
            if (partNumber && READING_PARTS.has(partNumber)) readingCorrectCount++;
        });

        const listeningScore = this.scaleToeicScore(listeningCorrectCount, 100);
        const readingScore = this.scaleToeicScore(readingCorrectCount, 100);

        session.status = ToeicSessionStatus.SUBMITTED;
        session.submittedAt = session.submittedAt ?? new Date();
        session.remainingSeconds = this.getRemainingSeconds(session);
        session.listeningCorrectCount = listeningCorrectCount;
        session.readingCorrectCount = readingCorrectCount;
        session.listeningScore = listeningScore;
        session.readingScore = readingScore;
        session.totalScore = listeningScore + readingScore;

        const submittedSession = await this.sessionRepository.save(session);

        return {
            session: submittedSession,
            summary: {
                totalQuestions: allQuestionIds.length,
                answeredCount: savedAnswers.length,
                unansweredCount: Math.max(allQuestionIds.length - savedAnswers.length, 0),
                listeningCorrectCount,
                readingCorrectCount,
                listeningScore,
                readingScore,
                totalScore: submittedSession.totalScore,
            },
            answers: savedAnswers.map((answer) => this.toAnswerPayload(answer, true)),
            questionResults: this.buildQuestionResults(questionById, savedAnswers),
        };
    }

    async start(userId: string, examSetId: number, restart = false) {
        this.ensurePositiveInteger(examSetId, "examSetId");

        const examSet = await this.getFullExamSetEntity(examSetId, false);
        if (!examSet.isPublished) {
            throw new AppError("TOEIC exam set is not published", 400);
        }
        const existingSession = await this.sessionRepository.findOne({
            where: {
                userId,
                examSetId,
                status: ToeicSessionStatus.IN_PROGRESS,
            },
        });

        if (restart && existingSession) {
            existingSession.status = ToeicSessionStatus.EXPIRED;
            existingSession.remainingSeconds = 0;
            existingSession.submittedAt = new Date();
            await this.sessionRepository.save(existingSession);
        } else if (existingSession) {
            await this.applyTimer(existingSession);
            if (existingSession.status === ToeicSessionStatus.EXPIRED) {
                throw new AppError("TOEIC session has expired", 400);
            }
        }

        const reusableSession = !restart && existingSession?.status === ToeicSessionStatus.IN_PROGRESS
            ? existingSession
            : null;

        const session = reusableSession
            ? reusableSession
            : await this.sessionRepository.save(
                this.sessionRepository.create({
                    userId,
                    examSetId,
                    status: ToeicSessionStatus.IN_PROGRESS,
                    currentPartNumber: 1,
                    currentQuestionId: this.getQuestionIds(examSet.parts ?? [])[0] ?? null,
                    startedAt: new Date(),
                    remainingSeconds: TOEIC_DURATION_SECONDS,
                })
            );

        const answers = await this.getSessionAnswers(session.id);

        return {
            session,
            examSet: await this.toPublicExamSet(examSetId),
            answers: answers.map((answer) => this.toAnswerPayload(answer, false)),
        };
    }

    async getSession(sessionId: number, userId: string) {
        let session = await this.getSessionForUser(sessionId, userId);
        session = await this.applyTimer(session);

        const includeCorrect = session.status === ToeicSessionStatus.SUBMITTED;
        const answers = await this.getSessionAnswers(session.id);

        return {
            session,
            examSet: await this.toeicExamSetService.getFull(session.examSetId, {
                includeCorrect,
                requirePublished: false,
            }),
            answers: answers.map((answer) => this.toAnswerPayload(answer, includeCorrect)),
        };
    }

    async answerQuestion(
        sessionId: number,
        userId: string,
        questionId: number,
        selectedOptionId: number,
        timeSpentSeconds = 0
    ) {
        let session = await this.getSessionForUser(sessionId, userId);
        session = await this.applyTimer(session);

        if (session.status !== ToeicSessionStatus.IN_PROGRESS) {
            throw new AppError("TOEIC session is not in progress", 400);
        }

        const examSet = await this.getFullExamSetEntity(session.examSetId, false);
        const questionById = this.getQuestionsById(examSet.parts ?? []);

        await this.saveAnswer(
            session,
            questionById,
            questionId,
            selectedOptionId,
            timeSpentSeconds
        );

        const savedAnswer = await this.sessionAnswerRepository.findOneOrFail({
            where: { sessionId, questionId },
        });

        return this.toAnswerPayload(savedAnswer, false);
    }

    async submit(sessionId: number, userId: string, answers: SubmitAnswerInput[] = []) {
        let session = await this.getSessionForUser(sessionId, userId);

        if (session.status === ToeicSessionStatus.SUBMITTED) {
            throw new AppError("TOEIC session has already been submitted", 400);
        }

        if (session.status === ToeicSessionStatus.EXPIRED && session.submittedAt) {
            throw new AppError("TOEIC session is not in progress", 400);
        }

        session = await this.applyTimer(session);
        const examSet = await this.getFullExamSetEntity(session.examSetId, false);
        const questionById = this.getQuestionsById(examSet.parts ?? []);

        if (session.status === ToeicSessionStatus.IN_PROGRESS) {
            for (const answer of answers) {
                if (answer.selectedOptionId !== null) {
                    await this.saveAnswer(
                        session,
                        questionById,
                        answer.questionId,
                        answer.selectedOptionId,
                        answer.timeSpentSeconds ?? 0
                    );
                }
            }
        }

        return this.buildSubmittedPayload(session, examSet);
    }

    async getResult(sessionId: number, userId: string) {
        let session = await this.getSessionForUser(sessionId, userId);
        const examSet = await this.getFullExamSetEntity(session.examSetId, false);

        if (session.status === ToeicSessionStatus.IN_PROGRESS) {
            session = await this.applyTimer(session);
        }

        if (session.status === ToeicSessionStatus.EXPIRED && !session.submittedAt) {
            const submittedResult = await this.buildSubmittedPayload(session, examSet);
            return {
                ...submittedResult,
                examSet: await this.toeicExamSetService.getFull(session.examSetId, {
                    includeCorrect: true,
                    requirePublished: false,
                }),
            };
        }

        if (session.status !== ToeicSessionStatus.SUBMITTED) {
            throw new AppError("TOEIC session has not been submitted", 400);
        }

        const allQuestionIds = this.getQuestionIds(examSet.parts ?? []);
        const answers = await this.getSessionAnswers(session.id);

        return {
            session,
            summary: {
                totalQuestions: allQuestionIds.length,
                answeredCount: answers.length,
                unansweredCount: Math.max(allQuestionIds.length - answers.length, 0),
                listeningCorrectCount: session.listeningCorrectCount,
                readingCorrectCount: session.readingCorrectCount,
                listeningScore: session.listeningScore,
                readingScore: session.readingScore,
                totalScore: session.totalScore,
            },
            examSet: await this.toeicExamSetService.getFull(session.examSetId, {
                includeCorrect: true,
                requirePublished: false,
            }),
            answers: answers.map((answer) => this.toAnswerPayload(answer, true)),
            questionResults: this.buildQuestionResults(this.getQuestionsById(examSet.parts ?? []), answers),
        };
    }

    async getHistory(userId: string) {
        const sessions = await this.sessionRepository.find({
            where: { userId },
            relations: {
                examSet: true,
                answers: true,
            },
            order: { createdAt: "DESC" },
        });

        return Promise.all(sessions.map(async (rawSession) => {
            const answerCount = rawSession.answers?.length ?? 0;
            const session = await this.applyTimer(rawSession);
            const correctCount = session.listeningCorrectCount + session.readingCorrectCount;
            const timeSpentSeconds = this.getTimeSpentSeconds(session);
            const scoreText = session.totalScore === null
                ? `${answerCount}/${TOEIC_TOTAL_QUESTIONS}`
                : `${correctCount}/${TOEIC_TOTAL_QUESTIONS} (Diem: ${session.totalScore})`;

            return {
                sessionId: session.id,
                examSetId: session.examSetId,
                examTitle: rawSession.examSet?.title,
                mode: "full_test",
                labels: [
                    { type: "full_test", text: "Full test" },
                ],
                status: session.status,
                date: session.startedAt ?? session.createdAt,
                startedAt: session.startedAt,
                submittedAt: session.submittedAt,
                result: {
                    correctCount,
                    answeredCount: answerCount,
                    totalQuestions: TOEIC_TOTAL_QUESTIONS,
                    listeningScore: session.listeningScore,
                    readingScore: session.readingScore,
                    totalScore: session.totalScore,
                    text: scoreText,
                },
                timeSpentSeconds,
                timeSpent: this.formatDuration(timeSpentSeconds),
                remainingSeconds: session.remainingSeconds,
                detailUrl: `/api/v1/toeic/sessions/${session.id}/result`,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
            };
        }));
    }
}


