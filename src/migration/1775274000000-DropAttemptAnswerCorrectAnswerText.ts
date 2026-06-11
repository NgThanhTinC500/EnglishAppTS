import { MigrationInterface, QueryRunner } from "typeorm";

export class DropAttemptAnswerCorrectAnswerText1775274000000 implements MigrationInterface {
    name = "DropAttemptAnswerCorrectAnswerText1775274000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN IF EXISTS "correctAnswerText"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "correctAnswerText" text`);
    }
}
