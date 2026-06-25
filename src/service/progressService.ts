import { AppDataSource } from "../data-source";
import { AnswerResult } from "../entity/AttemptAnswer";
import { QuestionCategory, QuestionType } from "../entity/Question";
import { TopicType } from "../entity/Topic";
import { VocabularyProgressStatus } from "../entity/UserVocabularyProgress";
import { VocabularyPracticeSession } from "../entity/VocabularyPracticeSession";
import {
    VocabularyPracticeMode,
    VocabularyPracticeResult,
} from "../entity/VocabularyPracticeEnums";

type ProgressPeriod = {
    days: number;
    from: Date;
    to: Date;
};

type ProgressSummaryRow = {
    answeredCount: number;
    correctCount: number;
    wrongCount: number;
};

type TopicProgressRow = {
    topicId: number;
    title: string;
    answeredCount: number;
    correctCount: number;
    wrongCount: number;
};

type RecentAttemptRow = {
    attemptId: number;
    topicId: number;
    topicTitle: string;
    examTitle: string;
    submittedAt: Date;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    score: string | number;
};

type VocabularyOverviewRow = {
    totalWords: number;
    learnedWords: number;
    masteredWords: number;
    reviewWords: number;
};

type VocabularyTodayRow = {
    spellingAnsweredCount: number;
    spellingCorrectCount: number;
    spellingWrongCount: number;
};

type ListeningProgressRow = {
    totalLessons: number;
    learnedLessons: number;
    checkAnsweredCount: number;
    checkCorrectCount: number;
    dictationAnsweredCount: number;
    dictationCorrectCount: number;
};

export class ProgressService {
    // ============================================================
    // Common helpers
    // ============================================================

    // Chuan hoa so ngay tu client: mac dinh 7 ngay, chi cho phep 1-90 ngay.
    private clampDays(days?: number) {
        if (!Number.isFinite(days)) return 7;
        return Math.min(Math.max(Math.trunc(days as number), 1), 90);
    }

    // Tao khoang thoi gian thong ke: tu hien tai lui ve n ngay truoc.
    private buildPeriod(days?: number): ProgressPeriod {
        const periodDays = this.clampDays(days);
        const to = new Date();
        const from = new Date(to);
        from.setDate(from.getDate() - periodDays);
        return { days: periodDays, from, to };
    }

    private toNumber(value: unknown) {
        return Number(value ?? 0);
    }
    // tính độ chính xác (accuracy) dựa trên số câu trả lời đúng và tổng số câu trả lời. Nếu không có câu trả lời, độ chính xác là 0.
    private getAccuracy(correctCount: number, answeredCount: number) {
        if (!answeredCount) return 0;
        return Math.round((correctCount / answeredCount) * 100);
    }

    // Mot so man thong ke cho phep khong truyen days, khi do se lay tong toan bo.
    private buildOptionalPeriod(days?: number) {
        if (!days || days <= 0) return null;
        return this.buildPeriod(days);
    }

    // ============================================================
    // Grammar progress
    // Flow:
    // 1. Lay tong cau da lam/dung/sai trong khoang ngay.
    // 2. Gom ket qua theo tung topic grammar.
    // 3. Lay 5 bai lam gan nhat va 3 topic yeu nhat de goi y on tap.
    // ============================================================

    // Tong hop tat ca cau grammar user da tra loi trong khoang thoi gian.
    // thống kê theo thời gian
    private async getAnswerSummary(userId: string, period: ProgressPeriod) {
        const rows = await AppDataSource.query(
            `
            SELECT
                COUNT(aa.id)::int AS "answeredCount",
                COUNT(aa.id) FILTER (WHERE aa.result = $4)::int AS "correctCount",
                COUNT(aa.id) FILTER (WHERE aa.result = $5)::int AS "wrongCount"
            FROM attempt_answers aa
            INNER JOIN attempts a
                ON a.id = aa."attemptId"
            INNER JOIN exam_questions eq
                ON eq."examId" = a."examId"
                AND eq."questionId" = aa."questionId"
            INNER JOIN questions q
                ON q.id = aa."questionId"
            INNER JOIN exams e
                ON e.id = a."examId"
            INNER JOIN topics t
                ON t.id = e."topicId"
            WHERE a."userId" = $1
                AND aa."answeredAt" >= $2
                AND aa."answeredAt" < $3
                AND t.type = $6
                AND q.category = $7
                AND q.type = $8
            `,
            [
                userId,
                period.from,
                period.to,
                AnswerResult.CORRECT,
                AnswerResult.WRONG,
                TopicType.GRAMMAR,
                QuestionCategory.GRAMMAR,
                QuestionType.SINGLE_CHOICE,
            ],
        );
        // luôn trả về mảng dù chỉ 1 dòng. nên lấy phần tử đầu tiên
        const row = rows[0] as ProgressSummaryRow | undefined;

        return {
            answeredCount: this.toNumber(row?.answeredCount),
            correctCount: this.toNumber(row?.correctCount),
            wrongCount: this.toNumber(row?.wrongCount),
        };
    }

    // Gom tien do theo topic: moi topic co so cau da lam, cau dung, cau sai, ti le dung.
    // thống kê theo chủ đề
    private async getTopicProgress(userId: string, period: ProgressPeriod) {
        const rows = await AppDataSource.query(
            `
            SELECT
                t.id::int AS "topicId",
                t.title AS "title",
                COUNT(aa.id)::int AS "answeredCount",
                COUNT(aa.id) FILTER (WHERE aa.result = $4)::int AS "correctCount",
                COUNT(aa.id) FILTER (WHERE aa.result = $5)::int AS "wrongCount"
            FROM attempt_answers aa
            INNER JOIN attempts a
                ON a.id = aa."attemptId"
            INNER JOIN exam_questions eq
                ON eq."examId" = a."examId"
                AND eq."questionId" = aa."questionId"
            INNER JOIN questions q
                ON q.id = aa."questionId"
            INNER JOIN exams e
                ON e.id = a."examId"
            INNER JOIN topics t
                ON t.id = e."topicId"
            WHERE a."userId" = $1
                AND aa."answeredAt" >= $2
                AND aa."answeredAt" < $3
                AND t.type = $6
                AND q.category = $7
                AND q.type = $8
            GROUP BY t.id, t.title
            ORDER BY
                CASE WHEN COUNT(aa.id) = 0 THEN 0
                    ELSE COUNT(aa.id) FILTER (WHERE aa.result = $4)::float / COUNT(aa.id)
                END DESC,
                "answeredCount" DESC
            `,
            [
                userId,
                period.from,
                period.to,
                AnswerResult.CORRECT,
                AnswerResult.WRONG,
                TopicType.GRAMMAR,
                QuestionCategory.GRAMMAR,
                QuestionType.SINGLE_CHOICE,
            ],
        );

        return (rows as TopicProgressRow[]).map((row) => {
            const answeredCount = this.toNumber(row.answeredCount);
            const correctCount = this.toNumber(row.correctCount);
            const wrongCount = this.toNumber(row.wrongCount);

            return {
                topicId: this.toNumber(row.topicId),
                title: row.title,
                answeredCount,
                correctCount,
                wrongCount,
                accuracyPercent: this.getAccuracy(correctCount, answeredCount),
            };
        });
    }

    // Lay cac bai grammar user nop gan nhat de hien thi lich su lam bai.
    // lấy 5 bài grammar gần đây nhất mà user đã làm để hiển thị lịch sử làm bài.
    private async getRecentAttempts(userId: string, period: ProgressPeriod) {
        const rows = await AppDataSource.query(
            `
            SELECT
                a.id::int AS "attemptId",
                t.id::int AS "topicId",
                t.title AS "topicTitle",
                e.title AS "examTitle",
                a."submittedAt" AS "submittedAt",
                a."totalQuestions"::int AS "totalQuestions",
                a."correctCount"::int AS "correctCount",
                GREATEST(a."totalQuestions" - a."correctCount", 0)::int AS "wrongCount",
                a.score AS "score"
            FROM attempts a
            INNER JOIN exams e
                ON e.id = a."examId"
            INNER JOIN topics t
                ON t.id = e."topicId"
            WHERE a."userId" = $1
                AND a."submittedAt" IS NOT NULL
                AND a."submittedAt" >= $2
                AND a."submittedAt" < $3
                AND t.type = $4
            ORDER BY a."submittedAt" DESC
            LIMIT 5
            `,
            [userId, period.from, period.to, TopicType.GRAMMAR],
        );

        return (rows as RecentAttemptRow[]).map((row) => {
            const totalQuestions = this.toNumber(row.totalQuestions);
            const correctCount = this.toNumber(row.correctCount);
            const wrongCount = this.toNumber(row.wrongCount);

            return {
                attemptId: this.toNumber(row.attemptId),
                topicId: this.toNumber(row.topicId),
                topicTitle: row.topicTitle,
                examTitle: row.examTitle,
                submittedAt: row.submittedAt,
                totalQuestions,
                correctCount,
                wrongCount,
                score: this.toNumber(row.score),
                accuracyPercent: this.getAccuracy(correctCount, totalQuestions),
            };
        });
    }

    async getGrammarProgress(userId: string, days?: number) {
        const period = this.buildPeriod(days);

        // Chay song song 3 query doc lap de trang progress tai nhanh hon.
        const [
            currentSummary,
            byTopic,
            recentAttempts,
        ] = await Promise.all([
            this.getAnswerSummary(userId, period),
            this.getTopicProgress(userId, period),
            this.getRecentAttempts(userId, period),
        ]);

        const currentAccuracy = this.getAccuracy(
            currentSummary.correctCount,
            currentSummary.answeredCount,
        );

        // Chi dem nhung topic user that su da lam cau hoi.
        const practicedTopicCount = byTopic.filter(
            (topic) => topic.answeredCount > 0,
        ).length;

        // Topic yeu = topic da lam nhung ti le dung thap nhat.
        const weakTopics = [...byTopic]
            .filter((topic) => topic.answeredCount > 0)
            .sort((first, second) => first.accuracyPercent - second.accuracyPercent)
            .slice(0, 3);

        return {
            period: {
                days: period.days,
                from: period.from.toISOString(),
                to: period.to.toISOString(),
            },
            summary: {
                ...currentSummary,
                accuracyPercent: currentAccuracy,
                practicedTopicCount,
            },
            byTopic,
            recentAttempts,
            weakTopics,
        };
    }

    // ============================================================
    // Listening progress
    // Flow:
    // 1. Dem tong lesson listening dang active.
    // 2. Dem lesson user da hoc qua attempt_answers.
    // 3. Tach ti le dung theo 2 dang: listening check va dictation.
    // ============================================================

    async getListeningProgress(userId: string) {
        // CTE available_questions lay danh sach cau listening co the hoc.
        // CTE user_answers lay cau user da tra loi de tinh completion va accuracy.
        const rows = await AppDataSource.query(
            `
            WITH available_questions AS (
                SELECT DISTINCT q.id, q.type
                FROM questions q
                INNER JOIN exam_questions eq
                    ON eq."questionId" = q.id
                INNER JOIN exams e
                    ON e.id = eq."examId"
                    AND e."isActive" = true
                INNER JOIN topics t
                    ON t.id = e."topicId"
                    AND t.type = $2
                WHERE q.category = $3
                    AND q.type IN ($4, $5)
            ),
            user_answers AS (
                SELECT aa."questionId", aa.result, aq.type
                FROM attempt_answers aa
                INNER JOIN attempts a
                    ON a.id = aa."attemptId"
                    AND a."userId" = $1
                INNER JOIN available_questions aq
                    ON aq.id = aa."questionId"
            )
            SELECT
                (SELECT COUNT(*) FROM available_questions)::int AS "totalLessons",
                (SELECT COUNT(DISTINCT ua."questionId") FROM user_answers ua)::int AS "learnedLessons",
                COUNT(*) FILTER (WHERE ua.type = $4)::int AS "checkAnsweredCount",
                COUNT(*) FILTER (
                    WHERE ua.type = $4 AND ua.result = $6
                )::int AS "checkCorrectCount",
                COUNT(*) FILTER (WHERE ua.type = $5)::int AS "dictationAnsweredCount",
                COUNT(*) FILTER (
                    WHERE ua.type = $5 AND ua.result = $6
                )::int AS "dictationCorrectCount"
            FROM user_answers ua
            `,
            [
                userId,
                TopicType.LISTENING,
                QuestionCategory.LISTENING,
                QuestionType.SINGLE_CHOICE,
                QuestionType.DICTATION,
                AnswerResult.CORRECT,
            ],
        );

        const row = rows[0] as ListeningProgressRow | undefined;
        const totalLessons = this.toNumber(row?.totalLessons);
        const learnedLessons = this.toNumber(row?.learnedLessons);
        const checkAnsweredCount = this.toNumber(row?.checkAnsweredCount);
        const checkCorrectCount = this.toNumber(row?.checkCorrectCount);
        const dictationAnsweredCount = this.toNumber(row?.dictationAnsweredCount);
        const dictationCorrectCount = this.toNumber(row?.dictationCorrectCount);
        const checkAccuracy = this.getAccuracy(
            checkCorrectCount,
            checkAnsweredCount,
        );
        const dictationAccuracy = this.getAccuracy(
            dictationCorrectCount,
            dictationAnsweredCount,
        );
        const totalAnswered = checkAnsweredCount + dictationAnsweredCount;
        const totalCorrect = checkCorrectCount + dictationCorrectCount;

        return {
            overview: {
                learnedLessons,
                totalLessons,
                remainingLessons: Math.max(totalLessons - learnedLessons, 0),
                completionPercent: totalLessons
                    ? Math.round((learnedLessons / totalLessons) * 100)
                    : 0,
            },
            accuracy: {
                averagePercent: this.getAccuracy(totalCorrect, totalAnswered),
                listeningCheck: {
                    answeredCount: checkAnsweredCount,
                    correctCount: checkCorrectCount,
                    accuracyPercent: checkAccuracy,
                },
                dictation: {
                    answeredCount: dictationAnsweredCount,
                    correctCount: dictationCorrectCount,
                    accuracyPercent: dictationAccuracy,
                },
            },
        };
    }

    // ============================================================
    // Vocabulary progress
    // Flow:
    // 1. Overview: tong tu, da hoc, da master, can review.
    // 2. Today: ket qua luyen spelling trong ngay hien tai theo gio Viet Nam.
    // 3. Latest session: phien luyen tap gan nhat de FE co the resume.
    // ============================================================

    // Lay moc dau/cuoi ngay theo gio Viet Nam de thong ke "hom nay" cho vocabulary.
    private getVietnamDayRange(date = new Date()) {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const todayKey = formatter.format(date);
        const from = new Date(`${todayKey}T00:00:00+07:00`);
        const to = new Date(from);
        to.setDate(to.getDate() + 1);

        return { todayKey, from, to };
    }

    // Format Date thanh yyyy-mm-dd theo gio Viet Nam.
    private getDateKey(value: Date) {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(value);
    }

    // Tong quan vocabulary: dem tien do cua user tren cac bo tu do admin tao.
    private async getVocabularyOverview(userId: string, period: ProgressPeriod | null) {
        const periodFilter = period
            ? `AND uvp."lastPracticedAt" >= $2 AND uvp."lastPracticedAt" < $3`
            : "";
        const params = period ? [userId, period.from, period.to] : [userId];

        const rows = await AppDataSource.query(
            `
            SELECT
                COUNT(v.id)::int AS "totalWords",
                COUNT(uvp.id) FILTER (WHERE uvp.id IS NOT NULL ${periodFilter})::int AS "learnedWords",
                COUNT(uvp.id) FILTER (WHERE uvp.status = '${VocabularyProgressStatus.MASTERED}' ${periodFilter})::int AS "masteredWords",
                COUNT(uvp.id) FILTER (WHERE uvp.status = '${VocabularyProgressStatus.REVIEW}' ${periodFilter})::int AS "reviewWords"
            FROM vocabulary v
            INNER JOIN vocabulary_sets vs
                ON vs.id = v."vocabSetId"
            INNER JOIN "user" owner
                ON owner.id = vs."userId"
                AND owner.role = 'admin'
            LEFT JOIN user_vocabulary_progress uvp
                ON uvp."vocabularyId" = v.id
                AND uvp."userId" = $1
            `,
            params,
        );

        const row = rows[0] as VocabularyOverviewRow | undefined;
        const totalWords = this.toNumber(row?.totalWords);
        const learnedWords = this.toNumber(row?.learnedWords);
        const masteredWords = this.toNumber(row?.masteredWords);
        const reviewWords = this.toNumber(row?.reviewWords);
        const notStartedWords = Math.max(totalWords - learnedWords, 0);

        return {
            totalWords,
            learnedWords,
            masteredWords,
            reviewWords,
            notStartedWords,
            progressPercent: totalWords
                ? Math.round((learnedWords / totalWords) * 100)
                : 0,
        };
    }

    // Thong ke rieng ket qua luyen spelling trong ngay hien tai.
    private async getVocabularyToday(userId: string) {
        const today = this.getVietnamDayRange();
        const rows = await AppDataSource.query(
            `
            SELECT
                COUNT(vpa.id)::int AS "spellingAnsweredCount",
                COUNT(vpa.id) FILTER (WHERE vpa.result = $4)::int AS "spellingCorrectCount",
                COUNT(vpa.id) FILTER (WHERE vpa.result = $5)::int AS "spellingWrongCount"
            FROM vocabulary_practice_answers vpa
            WHERE vpa."userId" = $1
                AND vpa."answeredAt" >= $2
                AND vpa."answeredAt" < $3
                AND vpa.mode = $6
            `,
            [
                userId,
                today.from,
                today.to,
                VocabularyPracticeResult.CORRECT,
                VocabularyPracticeResult.WRONG,
                VocabularyPracticeMode.SPELLING,
            ],
        );

        const row = rows[0] as VocabularyTodayRow | undefined;
        const spellingAnsweredCount = this.toNumber(row?.spellingAnsweredCount);
        const spellingCorrectCount = this.toNumber(row?.spellingCorrectCount);
        const spellingWrongCount = this.toNumber(row?.spellingWrongCount);

        return {
            spelling: {
                answeredCount: spellingAnsweredCount,
                correctCount: spellingCorrectCount,
                wrongCount: spellingWrongCount,
                accuracyPercent: spellingAnsweredCount
                    ? Math.round((spellingCorrectCount / spellingAnsweredCount) * 100)
                    : 0,
            },
        };
    }

    async getVocabularyProgress(userId: string, days?: number) {
        const period = this.buildOptionalPeriod(days);

        // 3 phan doc lap nen chay song song: overview, today, latestSession.
        const [overview, today, latestSession] = await Promise.all([
            this.getVocabularyOverview(userId, period),
            this.getVocabularyToday(userId),
            AppDataSource.getRepository(VocabularyPracticeSession).findOne({
                where: { userId, mode: VocabularyPracticeMode.SPELLING },
                order: { updatedAt: "DESC" },
            }),
        ]);

        return {
            period: period
                ? {
                    days: period.days,
                    from: period.from.toISOString(),
                    to: period.to.toISOString(),
                }
                : { days: null, from: null, to: null },
            overview,
            today,
            latestSession,
        };
    }
}
