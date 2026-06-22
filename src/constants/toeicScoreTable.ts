type ToeicSection = "listening" | "reading";

function clampCorrectCount(correctCount: number) {
    return Math.min(100, Math.max(0, Math.floor(correctCount)));
}

function buildScoreTable(getScore: (correctCount: number) => number) {
    return Array.from({ length: 101 }, (_, correctCount) => [
        correctCount,
        getScore(correctCount),
    ]).reduce<Record<number, number>>((table, [correctCount, score]) => {
        table[correctCount] = score;
        return table;
    }, {});
}

export const TOEIC_READING_SCORE_TABLE = buildScoreTable((correctCount) => {
    if (correctCount <= 2) return 5;
    return Math.min(495, (correctCount - 1) * 5);
});

export const TOEIC_LISTENING_SCORE_TABLE = buildScoreTable((correctCount) => {
    if (correctCount === 0) return 5;
    if (correctCount === 1) return 15;
    if (correctCount <= 75) return correctCount * 5 + 10;
    return Math.min(495, correctCount * 5 + 15);
});

export function getToeicSectionScore(
    section: ToeicSection,
    correctCount: number
) {
    const normalizedCorrectCount = clampCorrectCount(correctCount);

    if (section === "listening") {
        return TOEIC_LISTENING_SCORE_TABLE[normalizedCorrectCount] ?? 5;
    }

    return TOEIC_READING_SCORE_TABLE[normalizedCorrectCount] ?? 5;
}
