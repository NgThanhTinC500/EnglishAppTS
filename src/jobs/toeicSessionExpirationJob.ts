import { ToeicExamSessionService } from "../service/toeicExamSessionService";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function startToeicSessionExpirationJob() {
    const service = new ToeicExamSessionService();

    const run = async () => {
        try {
            const expiredCount = await service.expireOverdueSessions();
            if (expiredCount > 0) {
                console.log(`Expired ${expiredCount} overdue TOEIC exam session(s)`);
            }
        } catch (error) {
            console.error("Failed to expire overdue TOEIC exam sessions", error);
        }
    };

    void run();
    return setInterval(run, FIVE_MINUTES_MS);
}