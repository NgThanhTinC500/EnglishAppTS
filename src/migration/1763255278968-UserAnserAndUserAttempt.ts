import { MigrationInterface, QueryRunner } from "typeorm";

export class UserAnserAndUserAttempt1763255278968 implements MigrationInterface {
    name = 'UserAnserAndUserAttempt1763255278968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_answers" ("id" SERIAL NOT NULL, "attemptId" integer NOT NULL, "questionId" integer NOT NULL, "answerId" integer, "isCorrect" boolean NOT NULL DEFAULT false, "timeSpent" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08977c1a2a5f1b8b472dbd87d04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_exam_attempts" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "examId" integer NOT NULL, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "score" integer, "correctAnswers" integer, "totalQuestions" integer, "status" character varying(20) NOT NULL DEFAULT 'in_progress', "timeSpent" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3a354b30f187da1d485b023eeaa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_answers" ADD CONSTRAINT "FK_c8e6e678d62072038900fe3db5a" FOREIGN KEY ("attemptId") REFERENCES "user_exam_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_answers" ADD CONSTRAINT "FK_47a3ffddaba37b9707f93e4b140" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_answers" ADD CONSTRAINT "FK_c4731694c2bc85d2b5acc0cee37" FOREIGN KEY ("answerId") REFERENCES "answers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_exam_attempts" ADD CONSTRAINT "FK_0982d1d7c5aad75f19db8a30d80" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_exam_attempts" ADD CONSTRAINT "FK_39893c4c87e0645353d41cd1466" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_exam_attempts" DROP CONSTRAINT "FK_39893c4c87e0645353d41cd1466"`);
        await queryRunner.query(`ALTER TABLE "user_exam_attempts" DROP CONSTRAINT "FK_0982d1d7c5aad75f19db8a30d80"`);
        await queryRunner.query(`ALTER TABLE "user_answers" DROP CONSTRAINT "FK_c4731694c2bc85d2b5acc0cee37"`);
        await queryRunner.query(`ALTER TABLE "user_answers" DROP CONSTRAINT "FK_47a3ffddaba37b9707f93e4b140"`);
        await queryRunner.query(`ALTER TABLE "user_answers" DROP CONSTRAINT "FK_c8e6e678d62072038900fe3db5a"`);
        await queryRunner.query(`DROP TABLE "user_exam_attempts"`);
        await queryRunner.query(`DROP TABLE "user_answers"`);
    }

}
