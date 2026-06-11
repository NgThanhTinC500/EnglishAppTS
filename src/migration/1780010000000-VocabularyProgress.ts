import { MigrationInterface, QueryRunner } from "typeorm";

export class VocabularyProgress1780010000000 implements MigrationInterface {
    name = "VocabularyProgress1780010000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_vocabulary_progress_status_enum" AS ENUM('learning', 'mastered', 'review')`);
        await queryRunner.query(`CREATE TYPE "public"."vocabulary_practice_sessions_mode_enum" AS ENUM('flashcard', 'spelling')`);
        await queryRunner.query(`CREATE TYPE "public"."vocabulary_practice_answers_mode_enum" AS ENUM('flashcard', 'spelling')`);
        await queryRunner.query(`CREATE TYPE "public"."vocabulary_practice_answers_result_enum" AS ENUM('remembered', 'forgot', 'correct', 'wrong')`);
        await queryRunner.query(`
            CREATE TABLE "user_vocabulary_progress" (
                "id" SERIAL NOT NULL,
                "userId" uuid NOT NULL,
                "vocabularyId" integer NOT NULL,
                "vocabSetId" integer NOT NULL,
                "status" "public"."user_vocabulary_progress_status_enum" NOT NULL DEFAULT 'learning',
                "flashcardSeenCount" integer NOT NULL DEFAULT 0,
                "flashcardRememberedCount" integer NOT NULL DEFAULT 0,
                "flashcardForgotCount" integer NOT NULL DEFAULT 0,
                "spellingCorrectCount" integer NOT NULL DEFAULT 0,
                "spellingWrongCount" integer NOT NULL DEFAULT 0,
                "lastPracticedAt" TIMESTAMP,
                "nextReviewAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_user_vocabulary_progress_user_word" UNIQUE ("userId", "vocabularyId"),
                CONSTRAINT "PK_user_vocabulary_progress" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_user_vocabulary_progress_userId" ON "user_vocabulary_progress" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_vocabulary_progress_vocabularyId" ON "user_vocabulary_progress" ("vocabularyId")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_vocabulary_progress_vocabSetId" ON "user_vocabulary_progress" ("vocabSetId")`);
        await queryRunner.query(`
            CREATE TABLE "vocabulary_practice_sessions" (
                "id" SERIAL NOT NULL,
                "userId" uuid NOT NULL,
                "vocabSetId" integer NOT NULL,
                "mode" "public"."vocabulary_practice_sessions_mode_enum" NOT NULL,
                "startedAt" TIMESTAMP NOT NULL,
                "endedAt" TIMESTAMP,
                "seenCount" integer NOT NULL DEFAULT 0,
                "rememberedCount" integer NOT NULL DEFAULT 0,
                "forgotCount" integer NOT NULL DEFAULT 0,
                "correctCount" integer NOT NULL DEFAULT 0,
                "wrongCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_vocabulary_practice_sessions" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_vocabulary_practice_sessions_userId" ON "vocabulary_practice_sessions" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_vocabulary_practice_sessions_vocabSetId" ON "vocabulary_practice_sessions" ("vocabSetId")`);
        await queryRunner.query(`
            CREATE TABLE "vocabulary_practice_answers" (
                "id" SERIAL NOT NULL,
                "sessionId" integer NOT NULL,
                "userId" uuid NOT NULL,
                "vocabularyId" integer NOT NULL,
                "mode" "public"."vocabulary_practice_answers_mode_enum" NOT NULL,
                "result" "public"."vocabulary_practice_answers_result_enum" NOT NULL,
                "answerText" text,
                "answeredAt" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_vocabulary_practice_answers" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_vocabulary_practice_answers_sessionId" ON "vocabulary_practice_answers" ("sessionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_vocabulary_practice_answers_userId" ON "vocabulary_practice_answers" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_vocabulary_practice_answers_vocabularyId" ON "vocabulary_practice_answers" ("vocabularyId")`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "FK_user_vocabulary_progress_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "FK_user_vocabulary_progress_vocabulary" FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "FK_user_vocabulary_progress_set" FOREIGN KEY ("vocabSetId") REFERENCES "vocabulary_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_sessions" ADD CONSTRAINT "FK_vocabulary_practice_sessions_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_sessions" ADD CONSTRAINT "FK_vocabulary_practice_sessions_set" FOREIGN KEY ("vocabSetId") REFERENCES "vocabulary_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_answers" ADD CONSTRAINT "FK_vocabulary_practice_answers_session" FOREIGN KEY ("sessionId") REFERENCES "vocabulary_practice_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_answers" ADD CONSTRAINT "FK_vocabulary_practice_answers_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_answers" ADD CONSTRAINT "FK_vocabulary_practice_answers_vocabulary" FOREIGN KEY ("vocabularyId") REFERENCES "vocabulary"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_answers" DROP CONSTRAINT "FK_vocabulary_practice_answers_vocabulary"`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_answers" DROP CONSTRAINT "FK_vocabulary_practice_answers_user"`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_answers" DROP CONSTRAINT "FK_vocabulary_practice_answers_session"`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_sessions" DROP CONSTRAINT "FK_vocabulary_practice_sessions_set"`);
        await queryRunner.query(`ALTER TABLE "vocabulary_practice_sessions" DROP CONSTRAINT "FK_vocabulary_practice_sessions_user"`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" DROP CONSTRAINT "FK_user_vocabulary_progress_set"`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" DROP CONSTRAINT "FK_user_vocabulary_progress_vocabulary"`);
        await queryRunner.query(`ALTER TABLE "user_vocabulary_progress" DROP CONSTRAINT "FK_user_vocabulary_progress_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vocabulary_practice_answers_vocabularyId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vocabulary_practice_answers_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vocabulary_practice_answers_sessionId"`);
        await queryRunner.query(`DROP TABLE "vocabulary_practice_answers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vocabulary_practice_sessions_vocabSetId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_vocabulary_practice_sessions_userId"`);
        await queryRunner.query(`DROP TABLE "vocabulary_practice_sessions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_vocabulary_progress_vocabSetId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_vocabulary_progress_vocabularyId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_vocabulary_progress_userId"`);
        await queryRunner.query(`DROP TABLE "user_vocabulary_progress"`);
        await queryRunner.query(`DROP TYPE "public"."vocabulary_practice_answers_result_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vocabulary_practice_answers_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."vocabulary_practice_sessions_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_vocabulary_progress_status_enum"`);
    }
}
