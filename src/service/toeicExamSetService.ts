import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { ToeicCollection } from "../entity/ToeicCollection";
import { ToeicExamSet } from "../entity/ToeicExamSet";
import { ToeicExamPart } from "../entity/ToeicExamPart";
import { ToeicQuestion } from "../entity/ToeicQuestion";
import { AppError } from "../utils/appError";

const TOEIC_PART_RULES: Record<number, {
    questionCount: number;
    firstQuestion: number;
    lastQuestion: number;
    groupQuestionMin: number;
    groupQuestionMax: number;
    optionCount: number;
    requiresAudio?: boolean;
    requiresImage?: boolean;
}> = {
    1: { questionCount: 6, firstQuestion: 1, lastQuestion: 6, groupQuestionMin: 1, groupQuestionMax: 1, optionCount: 4, requiresAudio: true, requiresImage: true },
    2: { questionCount: 25, firstQuestion: 7, lastQuestion: 31, groupQuestionMin: 1, groupQuestionMax: 1, optionCount: 3, requiresAudio: true },
    3: { questionCount: 39, firstQuestion: 32, lastQuestion: 70, groupQuestionMin: 3, groupQuestionMax: 3, optionCount: 4, requiresAudio: true },
    4: { questionCount: 30, firstQuestion: 71, lastQuestion: 100, groupQuestionMin: 3, groupQuestionMax: 3, optionCount: 4, requiresAudio: true },
    5: { questionCount: 30, firstQuestion: 101, lastQuestion: 130, groupQuestionMin: 1, groupQuestionMax: 1, optionCount: 4 },
    6: { questionCount: 16, firstQuestion: 131, lastQuestion: 146, groupQuestionMin: 4, groupQuestionMax: 4, optionCount: 4, requiresImage: true },
    7: { questionCount: 54, firstQuestion: 147, lastQuestion: 200, groupQuestionMin: 2, groupQuestionMax: 5, optionCount: 4, requiresImage: true },
};

const TOEIC_TOTAL_QUESTIONS = 200;

interface FullExamOptions {
    includeCorrect?: boolean;
    requirePublished?: boolean;
}

export class ToeicExamSetService {
    private toeicExamSetRepository: Repository<ToeicExamSet>;
    private toeicCollectionRepository: Repository<ToeicCollection>;

    constructor() {
        this.toeicExamSetRepository = AppDataSource.getRepository(ToeicExamSet);
        this.toeicCollectionRepository = AppDataSource.getRepository(ToeicCollection);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private async ensureCollectionExists(collectionId: number) {
        this.ensurePositiveInteger(collectionId, "collectionId");

        const collection = await this.toeicCollectionRepository.findOne({
            where: { id: collectionId },
        });

        if (!collection) throw new AppError("Toeic collection not found", 404);
    }

    private async getFullEntity(id: number, requirePublished = false) {
        this.ensurePositiveInteger(id, "id");

        const examSet = await this.toeicExamSetRepository.findOne({
            where: requirePublished ? { id, isPublished: true } : { id },
            relations: {
                collection: true,
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

        if (!examSet) throw new AppError("Toeic exam set not found", 404);

        return examSet;
    }

    private countPartQuestions(part: ToeicExamPart) {
        return part.questionGroups?.reduce(
            (total, group) => total + (group.questions?.length ?? 0),
            0
        ) ?? 0;
    }

    private toQuestionPayload(question: ToeicQuestion, includeCorrect: boolean) {
        const options = question.options?.map((option) => ({
            id: option.id,
            questionId: option.questionId,
            optionLabel: option.optionLabel,
            contentEn: option.contentEn,
            contentVi: option.contentVi,
            ...(includeCorrect ? { isCorrect: option.isCorrect } : {}),
        })) ?? [];

        return {
            id: question.id,
            questionGroupId: question.questionGroupId,
            questionNumber: question.questionNumber,
            contentEn: question.contentEn,
            contentVi: question.contentVi,
            explanationVi: includeCorrect ? question.explanationVi : undefined,
            correctOptionId: includeCorrect ? question.correctOptionId : undefined,
            options,
        };
    }

    private toFullPayload(examSet: ToeicExamSet, includeCorrect: boolean) {
        return {
            id: examSet.id,
            collectionId: examSet.collectionId,
            collection: examSet.collection,
            title: examSet.title,
            isPublished: examSet.isPublished,
            durationSeconds: 120 * 60,
            totalQuestions: TOEIC_TOTAL_QUESTIONS,
            parts: examSet.parts?.map((part) => ({
                id: part.id,
                examSetId: part.examSetId,
                partNumber: part.partNumber,
                questionCount: part.questionCount,
                actualQuestionCount: this.countPartQuestions(part),
                durationSeconds: part.durationSeconds,
                groups: part.questionGroups?.map((group) => ({
                    id: group.id,
                    examPartId: group.examPartId,
                    groupOrder: group.groupOrder,
                    audioUrl: group.audioUrl,
                    audioDurationSeconds: group.audioDurationSeconds,
                    transcriptEn: includeCorrect ? group.transcriptEn : undefined,
                    transcriptVi: includeCorrect ? group.transcriptVi : undefined,
                    images: group.images?.map((image) => ({
                        id: image.id,
                        imageOrder: image.imageOrder,
                        imageUrl: image.imageUrl,
                    })) ?? [],
                    questions: group.questions?.map((question) =>
                        this.toQuestionPayload(question, includeCorrect)
                    ) ?? [],
                })) ?? [],
            })) ?? [],
        };
    }

    private validateExamSetEntity(examSet: ToeicExamSet) {
        const issues: string[] = [];
        const parts = examSet.parts ?? [];
        const seenQuestionNumbers = new Set<number>();
        let totalQuestions = 0;

        Object.entries(TOEIC_PART_RULES).forEach(([partNumberString, rule]) => {
            const partNumber = Number(partNumberString);
            const part = parts.find((item) => item.partNumber === partNumber);

            if (!part) {
                issues.push(`Part ${partNumber} is missing`);
                return;
            }

            if (part.questionCount !== rule.questionCount) {
                issues.push(`Part ${partNumber} questionCount must be ${rule.questionCount}`);
            }

            const groups = part.questionGroups ?? [];
            const partQuestionCount = this.countPartQuestions(part);
            totalQuestions += partQuestionCount;

            if (partQuestionCount !== rule.questionCount) {
                issues.push(`Part ${partNumber} must contain ${rule.questionCount} questions, currently ${partQuestionCount}`);
            }

            groups.forEach((group) => {
                const questions = group.questions ?? [];
                const questionCount = questions.length;

                if (questionCount < rule.groupQuestionMin || questionCount > rule.groupQuestionMax) {
                    const range = rule.groupQuestionMin === rule.groupQuestionMax
                        ? `${rule.groupQuestionMin}`
                        : `${rule.groupQuestionMin}-${rule.groupQuestionMax}`;
                    issues.push(`Part ${partNumber} group ${group.groupOrder} must have ${range} questions`);
                }

                if (rule.requiresAudio && !group.audioUrl) {
                    issues.push(`Part ${partNumber} group ${group.groupOrder} must have audio`);
                }

                if (rule.requiresImage && !group.images?.length) {
                    issues.push(`Part ${partNumber} group ${group.groupOrder} must have at least one image`);
                }

                questions.forEach((question) => {
                    if (question.questionNumber < rule.firstQuestion || question.questionNumber > rule.lastQuestion) {
                        issues.push(`Question ${question.questionNumber} is outside part ${partNumber} range ${rule.firstQuestion}-${rule.lastQuestion}`);
                    }

                    if (seenQuestionNumbers.has(question.questionNumber)) {
                        issues.push(`Question number ${question.questionNumber} is duplicated`);
                    }
                    seenQuestionNumbers.add(question.questionNumber);

                    const options = question.options ?? [];
                    if (options.length !== rule.optionCount) {
                        issues.push(`Question ${question.questionNumber} must have ${rule.optionCount} options`);
                    }

                    const correctOptions = options.filter((option) => option.isCorrect);
                    if (correctOptions.length !== 1) {
                        issues.push(`Question ${question.questionNumber} must have exactly one correct option`);
                    }

                    if (correctOptions[0] && question.correctOptionId !== correctOptions[0].id) {
                        issues.push(`Question ${question.questionNumber} correctOptionId does not match its correct option`);
                    }
                });
            });
        });

        if (parts.length !== 7) {
            issues.push(`Exam set must have exactly 7 parts, currently ${parts.length}`);
        }

        if (totalQuestions !== TOEIC_TOTAL_QUESTIONS) {
            issues.push(`Exam set must contain ${TOEIC_TOTAL_QUESTIONS} questions, currently ${totalQuestions}`);
        }

        return {
            isValid: issues.length === 0,
            issues,
            totalQuestions,
        };
    }

    async getAll(collectionId: number) {
        await this.ensureCollectionExists(collectionId);

        return this.toeicExamSetRepository.find({
            where: { collectionId },
            order: { createdAt: "DESC" },
        });
    }

    async getById(collectionId: number, id: number) {
        await this.ensureCollectionExists(collectionId);
        this.ensurePositiveInteger(id, "id");

        const examSet = await this.toeicExamSetRepository.findOne({
            where: { id, collectionId },
        });

        if (!examSet) throw new AppError("Toeic exam set not found", 404);

        return examSet;
    }

    async getFull(id: number, options: FullExamOptions = {}) {
        const examSet = await this.getFullEntity(id, options.requirePublished ?? false);
        return this.toFullPayload(examSet, options.includeCorrect ?? true);
    }

    async validate(id: number) {
        const examSet = await this.getFullEntity(id);
        return this.validateExamSetEntity(examSet);
    }

    async publish(id: number, isPublished = true) {
        const examSet = await this.getFullEntity(id);

        examSet.isPublished = isPublished;
        return this.toeicExamSetRepository.save(examSet);
    }

    async create(data: Partial<ToeicExamSet>) {
        if (data.collectionId === undefined) {
            throw new AppError("collectionId is required", 400);
        }
        await this.ensureCollectionExists(data.collectionId);

        if (!data.title?.trim()) {
            throw new AppError("Title is required", 400);
        }

        const examSet = this.toeicExamSetRepository.create({
            collectionId: data.collectionId,
            title: data.title.trim(),
            isPublished: data.isPublished ?? false,
        });

        return this.toeicExamSetRepository.save(examSet);
    }

    async update(collectionId: number, id: number, data: Partial<ToeicExamSet>) {
        await this.ensureCollectionExists(collectionId);
        this.ensurePositiveInteger(id, "id");

        const examSet = await this.toeicExamSetRepository.findOne({
            where: { id, collectionId },
        });

        if (!examSet) throw new AppError("Toeic exam set not found", 404);

        if (data.title !== undefined) {
            if (!data.title.trim()) throw new AppError("Title is required", 400);
            examSet.title = data.title.trim();
        }

        if (data.isPublished !== undefined) {
            examSet.isPublished = data.isPublished;
        }

        return this.toeicExamSetRepository.save(examSet);
    }

    async softDelete(collectionId: number, id: number) {
        await this.ensureCollectionExists(collectionId);
        this.ensurePositiveInteger(id, "id");

        const examSet = await this.toeicExamSetRepository.findOne({
            where: { id, collectionId },
        });

        if (!examSet) throw new AppError("Toeic exam set not found", 404);

        await this.toeicExamSetRepository.softDelete(id);
    }
}

