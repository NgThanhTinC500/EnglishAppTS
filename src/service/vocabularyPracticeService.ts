import { AppDataSource } from "../data-source";
import { UserRole } from "../entity/User";
import { UserVocabularyProgress, VocabularyProgressStatus } from "../entity/UserVocabularyProgress";
import { Vocabulary } from "../entity/Vocabulary";
import { VocabularyPracticeAnswer } from "../entity/VocabularyPracticeAnswer";
import {
    VocabularyPracticeMode,
    VocabularyPracticeResult,
} from "../entity/VocabularyPracticeEnums";
import { VocabularyPracticeSession } from "../entity/VocabularyPracticeSession";
import { VocabularySet } from "../entity/VocabularySet";
import { AppError } from "../utils/appError";

export class VocabularyPracticeService {
    private vocabularySetRepository = AppDataSource.getRepository(VocabularySet);

    private vocabularyRepository = AppDataSource.getRepository(Vocabulary);

    private progressRepository = AppDataSource.getRepository(UserVocabularyProgress);

    private sessionRepository = AppDataSource.getRepository(VocabularyPracticeSession);

    private practiceAnswerRepository = AppDataSource.getRepository(VocabularyPracticeAnswer);

    private normalizeAnswer(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[|\n\r]+/g, " ")
            .replace(/[.,!?;:"'()]/g, "")
            .replace(/\s+/g, " ");
    }

    private async findVocabularySetOrFail(
        setId: number,
        relations?: { vocabularies?: boolean }
    ) {
        const vocabularySet = await this.vocabularySetRepository.findOne({
            where: {
                id: setId,
                user: {
                    role: UserRole.ADMIN,
                },
            },
            relations,
        });

        if (!vocabularySet) {
            throw new AppError("Vocabulary bộ không tồn tại", 404);
        }

        return vocabularySet;
    }

    private ensurePracticeMode(mode: string) {
        if (!Object.values(VocabularyPracticeMode).includes(mode as VocabularyPracticeMode)) {
            throw new AppError("Invalid vocabulary practice mode", 400);
        }

        return mode as VocabularyPracticeMode;
    }

    private async findUserSessionOrFail(sessionId: number, userId: string) {
        const session = await this.sessionRepository.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) {
            throw new AppError("Vocabulary practice session not found", 404);
        }

        return session;
    }

    private async findVocabularyForPracticeOrFail(vocabularyId: number) {
        const vocabulary = await this.vocabularyRepository.findOne({
            where: {
                id: vocabularyId,
                vocabularySet: {
                    user: {
                        role: UserRole.ADMIN,
                    },
                },
            },
            relations: {
                vocabularySet: {
                    user: true,
                },
            },
        });

        if (!vocabulary) {
            throw new AppError("Vocabulary không tồn tại", 404);
        }

        return vocabulary;
    }

    private getNextReviewDate(status: VocabularyProgressStatus) {
        const nextReviewAt = new Date();

        if (status === VocabularyProgressStatus.MASTERED) {
            nextReviewAt.setDate(nextReviewAt.getDate() + 7);
            return nextReviewAt;
        }

        nextReviewAt.setDate(nextReviewAt.getDate() + 1);
        return nextReviewAt;
    }

    private getProgressStatusFromResult(result: VocabularyPracticeResult) {
        if (result === VocabularyPracticeResult.CORRECT) {
            return VocabularyProgressStatus.MASTERED;
        }

        if (result === VocabularyPracticeResult.WRONG) {
            return VocabularyProgressStatus.REVIEW;
        }

        return VocabularyProgressStatus.LEARNING;
    }

    private async updateVocabularyProgress(
        userId: string,
        vocabulary: Vocabulary,
        result: VocabularyPracticeResult,
        practicedAt: Date
    ) {
        let progress = await this.progressRepository.findOne({
            where: { userId, vocabularyId: vocabulary.id },
        });

        if (!progress) {
            progress = this.progressRepository.create({
                userId,
                vocabularyId: vocabulary.id,
                vocabSetId: vocabulary.vocabSetId,
                status: VocabularyProgressStatus.LEARNING,
                spellingCorrectCount: 0,
                spellingWrongCount: 0,
                lastPracticedAt: practicedAt,
            });
        }

        progress.spellingCorrectCount = progress.spellingCorrectCount ?? 0;
        progress.spellingWrongCount = progress.spellingWrongCount ?? 0;

        if (result === VocabularyPracticeResult.CORRECT) {
            progress.spellingCorrectCount += 1;
        }

        if (result === VocabularyPracticeResult.WRONG) {
            progress.spellingWrongCount += 1;
        }

        progress.status = this.getProgressStatusFromResult(result);
        progress.lastPracticedAt = practicedAt;
        progress.nextReviewAt = this.getNextReviewDate(progress.status);

        return this.progressRepository.save(progress);
    }

    async getVocabularyPracticeItems(setId: number) {
        const vocabularySet = await this.findVocabularySetOrFail(setId, {
            vocabularies: true,
        });

        return vocabularySet.vocabularies.map((vocabulary) => ({
            id: vocabulary.id,
            prompt: vocabulary.meaning,
            example: vocabulary.example,
        }));
    }

    async checkVocabularyPracticeAnswer(
        vocabularyId: number,
        answerText: string
    ) {
        if (!answerText.trim()) {
            throw new AppError("Phải nhập đáp án", 400);
        }

        const vocabulary = await this.findVocabularyForPracticeOrFail(vocabularyId);
        const isCorrect =
            this.normalizeAnswer(answerText) === this.normalizeAnswer(vocabulary.word);

        return {
            vocabularyId: vocabulary.id,
            answerText,
            isCorrect,
            correctAnswer: vocabulary.word,
            meaning: vocabulary.meaning,
            example: vocabulary.example,
        };
    }

    async startPracticeSession(
        userId: string,
        vocabSetId: number,
        modeValue: string
    ) {
        await this.findVocabularySetOrFail(vocabSetId);

        const mode = this.ensurePracticeMode(modeValue);

        return this.sessionRepository.save(
            this.sessionRepository.create({
                userId,
                vocabSetId,
                mode,
                startedAt: new Date(),
            })
        );
    }

    async submitSpellingAnswer(
        userId: string,
        sessionId: number,
        vocabularyId: number,
        answerText: string
    ) {
        if (!answerText.trim()) {
            throw new AppError("Phải nhập đáp án", 400);
        }

        const session = await this.findUserSessionOrFail(sessionId, userId);
        if (session.mode !== VocabularyPracticeMode.SPELLING) {
            throw new AppError("Phiên luyện tập không phải là phiên kiểm tra chính tả", 400);
        }

        const vocabulary = await this.findVocabularyForPracticeOrFail(vocabularyId);
        if (vocabulary.vocabSetId !== session.vocabSetId) {
            throw new AppError("Từ vựng không thuộc về bộ luyện tập này", 400);
        }

        const isCorrect =
            this.normalizeAnswer(answerText) === this.normalizeAnswer(vocabulary.word);
        const result = isCorrect
            ? VocabularyPracticeResult.CORRECT
            : VocabularyPracticeResult.WRONG;
        const answeredAt = new Date();

        const answer = await this.practiceAnswerRepository.save(
            this.practiceAnswerRepository.create({
                sessionId,
                userId,
                vocabularyId,
                mode: VocabularyPracticeMode.SPELLING,
                result,
                answerText,
                answeredAt,
            })
        );

        session.correctCount = session.correctCount ?? 0;
        session.wrongCount = session.wrongCount ?? 0;
        if (isCorrect) {
            session.correctCount += 1;
        } else {
            session.wrongCount += 1;
        }
        session.endedAt = answeredAt;
        await this.sessionRepository.save(session);

        const progress = await this.updateVocabularyProgress(
            userId,
            vocabulary,
            result,
            answeredAt
        );

        return {
            answer,
            session,
            progress,
            vocabularyId: vocabulary.id,
            answerText,
            isCorrect,
            correctAnswer: vocabulary.word,
            meaning: vocabulary.meaning,
            example: vocabulary.example,
        };
    }
}
