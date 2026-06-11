import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDictationQuestionSupport1775273000000 implements MigrationInterface {
    name = "AddDictationQuestionSupport1775273000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum" ADD VALUE IF NOT EXISTS 'dictation'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "dictationAnswer" text`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "answerText" text`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "correctAnswerText" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "correctAnswerText"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "answerText"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "dictationAnswer"`);
        await queryRunner.query(`CREATE TYPE "public"."questions_type_enum_old" AS ENUM('single_choice')`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "type" TYPE "public"."questions_type_enum_old" USING "type"::"text"::"public"."questions_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "type" SET DEFAULT 'single_choice'`);
        await queryRunner.query(`DROP TYPE "public"."questions_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."questions_type_enum_old" RENAME TO "questions_type_enum"`);
    }
}
