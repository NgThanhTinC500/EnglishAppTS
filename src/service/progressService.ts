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

type TimeSummaryRow = {
    totalSeconds: number;
    answeredCount: number;
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
    flashcardSeenCount: number;
    flashcardRememberedCount: number;
    flashcardForgotCount: number;
    spellingAnsweredCount: number;
    spellingCorrectCount: number;
    spellingWrongCount: number;
};

type VocabularyActivityDayRow = {
    activityDate: string;
    activityCount: number;
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
    private clampDays(days?: number) {
        if (!Number.isFinite(days)) return 7;
        return Math.min(Math.max(Math.trunc(days as number), 1), 90);
    }

    private buildPeriod(days?: number): ProgressPeriod {
        const periodDays = this.clampDays(days);
        const to = new Date();
        const from = new Date(to);
        from.setDate(from.getDate() - periodDays);

        return { days: periodDays, from, to };
    }

    private buildPreviousPeriod(period: ProgressPeriod): ProgressPeriod {
        const to = new Date(period.from);
        const from = new Date(to);
        from.setDate(from.getDate() - period.days);

        return { days: period.days, from, to };
    }

    private toNumber(value: unknown) {
        return Number(value ?? 0);
    }

    private getAccuracy(correctCount: number, answeredCount: number) {
        if (!answeredCount) return 0;
        return Math.round((correctCount / answeredCount) * 100);
    }

    private getAverageSeconds(totalSeconds: number, answeredCount: number) {
        if (!answeredCount) return 0;
        return Math.round(totalSeconds / answeredCount);
    }

    private getDelta(current: number, previous: number) {
        return current - previous;
    }

    private buildOptionalPeriod(days?: number) {
        if (!days || days <= 0) return null;
        return this.buildPeriod(days);
    }

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

        const row = rows[0] as ProgressSummaryRow | undefined;

        return {
            answeredCount: this.toNumber(row?.answeredCount),
            correctCount: this.toNumber(row?.correctCount),
            wrongCount: this.toNumber(row?.wrongCount),
        };
    }

    private async getTimeSummary(userId: string, period: ProgressPeriod) {
        const rows = await AppDataSource.query(
            `
            SELECT
                COALESCE(SUM(EXTRACT(EPOCH FROM (a."submittedAt" - a."startedAt"))), 0)::int AS "totalSeconds",
                COALESCE(SUM(a."totalQuestions"), 0)::int AS "answeredCount"
            FROM attempts a
            INNER JOIN exams e
                ON e.id = a."examId"
            INNER JOIN topics t
                ON t.id = e."topicId"
            WHERE a."userId" = $1
                AND a."submittedAt" IS NOT NULL
                AND a."startedAt" IS NOT NULL
                AND a."submittedAt" >= $2
                AND a."submittedAt" < $3
                AND t.type = $4
            `,
            [userId, period.from, period.to, TopicType.GRAMMAR],
        );

        const row = rows[0] as TimeSummaryRow | undefined;

        return {
            totalSeconds: this.toNumber(row?.totalSeconds),
            answeredCount: this.toNumber(row?.answeredCount),
        };
    }

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
        const previousPeriod = this.buildPreviousPeriod(period);

        const [
            currentSummary,
            previousSummary,
            currentTime,
            previousTime,
            byTopic,
            recentAttempts,
        ] = await Promise.all([
            this.getAnswerSummary(userId, period),
            this.getAnswerSummary(userId, previousPeriod),
            this.getTimeSummary(userId, period),
            this.getTimeSummary(userId, previousPeriod),
            this.getTopicProgress(userId, period),
            this.getRecentAttempts(userId, period),
        ]);

        const currentAccuracy = this.getAccuracy(
            currentSummary.correctCount,
            currentSummary.answeredCount,
        );
        const previousAccuracy = this.getAccuracy(
            previousSummary.correctCount,
            previousSummary.answeredCount,
        );
        const currentAvgSeconds = this.getAverageSeconds(
            currentTime.totalSeconds,
            currentTime.answeredCount,
        );
        const previousAvgSeconds = this.getAverageSeconds(
            previousTime.totalSeconds,
            previousTime.answeredCount,
        );
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
                avgSecondsPerQuestion: currentAvgSeconds,
                deltas: {
                    answeredCount: this.getDelta(
                        currentSummary.answeredCount,
                        previousSummary.answeredCount,
                    ),
                    correctCount: this.getDelta(
                        currentSummary.correctCount,
                        previousSummary.correctCount,
                    ),
                    wrongCount: this.getDelta(
                        currentSummary.wrongCount,
                        previousSummary.wrongCount,
                    ),
                    accuracyPercent: this.getDelta(currentAccuracy, previousAccuracy),
                    avgSecondsPerQuestion: this.getDelta(
                        currentAvgSeconds,
                        previousAvgSeconds,
                    ),
                },
            },
            byTopic,
            recentAttempts,
            weakTopics,
        };
    }

    async getListeningProgress(userId: string) {
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

    private getDateKey(value: Date) {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(value);
    }

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

    private async getVocabularyToday(userId: string) {
        const today = this.getVietnamDayRange();
        const rows = await AppDataSource.query(
            `
            SELECT
                COUNT(vpa.id) FILTER (WHERE vpa.mode = $4)::int AS "flashcardSeenCount",
                COUNT(vpa.id) FILTER (WHERE vpa.result = $5)::int AS "flashcardRememberedCount",
                COUNT(vpa.id) FILTER (WHERE vpa.result = $6)::int AS "flashcardForgotCount",
                COUNT(vpa.id) FILTER (WHERE vpa.mode = $7)::int AS "spellingAnsweredCount",
                COUNT(vpa.id) FILTER (WHERE vpa.result = $8)::int AS "spellingCorrectCount",
                COUNT(vpa.id) FILTER (WHERE vpa.result = $9)::int AS "spellingWrongCount"
            FROM vocabulary_practice_answers vpa
            WHERE vpa."userId" = $1
                AND vpa."answeredAt" >= $2
                AND vpa."answeredAt" < $3
            `,
            [
                userId,
                today.from,
                today.to,
                VocabularyPracticeMode.FLASHCARD,
                VocabularyPracticeResult.REMEMBERED,
                VocabularyPracticeResult.FORGOT,
                VocabularyPracticeMode.SPELLING,
                VocabularyPracticeResult.CORRECT,
                VocabularyPracticeResult.WRONG,
            ],
        );

        const row = rows[0] as VocabularyTodayRow | undefined;
        const flashcardSeenCount = this.toNumber(row?.flashcardSeenCount);
        const flashcardRememberedCount = this.toNumber(row?.flashcardRememberedCount);
        const flashcardForgotCount = this.toNumber(row?.flashcardForgotCount);
        const spellingAnsweredCount = this.toNumber(row?.spellingAnsweredCount);
        const spellingCorrectCount = this.toNumber(row?.spellingCorrectCount);
        const spellingWrongCount = this.toNumber(row?.spellingWrongCount);

        return {
            flashcard: {
                seenCount: flashcardSeenCount,
                rememberedCount: flashcardRememberedCount,
                forgotCount: flashcardForgotCount,
                rememberedPercent: flashcardSeenCount
                    ? Math.round((flashcardRememberedCount / flashcardSeenCount) * 100)
                    : 0,
            },
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

    private async getVocabularyActivityDays(userId: string) {
        const rows = await AppDataSource.query(
            `
            SELECT
                TO_CHAR(vpa."answeredAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS "activityDate",
                COUNT(vpa.id)::int AS "activityCount"
            FROM vocabulary_practice_answers vpa
            WHERE vpa."userId" = $1
            GROUP BY "activityDate"
            ORDER BY "activityDate" DESC
            `,
            [userId],
        );

        return (rows as VocabularyActivityDayRow[]).map((row) => ({
            date: row.activityDate,
            count: this.toNumber(row.activityCount),
        }));
    }

    private buildVocabularyStreak(activityDays: { date: string; count: number }[]) {
        const activityMap = new Map(activityDays.map((item) => [item.date, item.count]));
        const todayRange = this.getVietnamDayRange();
        const today = new Date(`${todayRange.todayKey}T00:00:00+07:00`);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const cursor = activityMap.has(todayRange.todayKey) ? today : yesterday;
        let current = 0;

        while (activityMap.has(this.getDateKey(cursor))) {
            current += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        const sortedDates = activityDays
            .map((item) => item.date)
            .sort();
        let longest = 0;
        let run = 0;
        let previousDate: Date | null = null;

        sortedDates.forEach((dateKey) => {
            const currentDate = new Date(`${dateKey}T00:00:00+07:00`);
            const expectedPrevious = previousDate ? new Date(previousDate) : null;
            expectedPrevious?.setDate(expectedPrevious.getDate() + 1);

            if (previousDate && expectedPrevious && this.getDateKey(expectedPrevious) === dateKey) {
                run += 1;
            } else {
                run = 1;
            }

            longest = Math.max(longest, run);
            previousDate = currentDate;
        });

        return {
            current,
            longest,
            studiedToday: activityMap.has(todayRange.todayKey),
            lastStudyDate: activityDays[0]?.date ?? null,
        };
    }

    private buildVocabularyCalendar(activityDays: { date: string; count: number }[]) {
        const today = this.getVietnamDayRange();
        const currentMonth = today.todayKey.slice(0, 7);
        const monthDate = new Date(`${currentMonth}-01T00:00:00+07:00`);
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const activityMap = new Map(activityDays.map((item) => [item.date, item.count]));

        return Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            const count = activityMap.get(dateKey) ?? 0;

            return {
                date: dateKey,
                day,
                count,
                level: count >= 5 ? "strong" : count > 0 ? "light" : "none",
            };
        });
    }

    async getVocabularyProgress(userId: string, days?: number) {
        const period = this.buildOptionalPeriod(days);
        const [overview, today, activityDays, latestSession] = await Promise.all([
            this.getVocabularyOverview(userId, period),
            this.getVocabularyToday(userId),
            this.getVocabularyActivityDays(userId),
            AppDataSource.getRepository(VocabularyPracticeSession).findOne({
                where: { userId },
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
            streak: this.buildVocabularyStreak(activityDays),
            calendar: this.buildVocabularyCalendar(activityDays),
            latestSession,
        };
    }
}
