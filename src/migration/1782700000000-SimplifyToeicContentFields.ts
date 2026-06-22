import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyToeicContentFields1782700000000 implements MigrationInterface {
    name = "SimplifyToeicContentFields1782700000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" ADD "explanation" text`);
        await queryRunner.query(`UPDATE "toeic_question_groups" SET "explanation" = COALESCE("transcriptVi", "transcriptEn")`);
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" DROP COLUMN "transcriptEn"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" DROP COLUMN "transcriptVi"`);

        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD "content" text`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD "explanation" text`);
        await queryRunner.query(`UPDATE "toeic_questions" SET "content" = COALESCE("contentEn", "contentVi"), "explanation" = "explanationVi"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP COLUMN "contentEn"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP COLUMN "contentVi"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP COLUMN "explanationVi"`);

        await queryRunner.query(`ALTER TABLE "toeic_question_options" ADD "content" text`);
        await queryRunner.query(`UPDATE "toeic_question_options" SET "content" = COALESCE("contentEn", "contentVi", '')`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" ALTER COLUMN "content" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" DROP COLUMN "contentEn"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" DROP COLUMN "contentVi"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "toeic_question_options" ADD "contentEn" text`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" ADD "contentVi" text`);
        await queryRunner.query(`UPDATE "toeic_question_options" SET "contentEn" = "content"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" ALTER COLUMN "contentEn" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" DROP COLUMN "content"`);

        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD "contentEn" text`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD "contentVi" text`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD "explanationVi" text`);
        await queryRunner.query(`UPDATE "toeic_questions" SET "contentEn" = "content", "explanationVi" = "explanation"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP COLUMN "explanation"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP COLUMN "content"`);

        await queryRunner.query(`ALTER TABLE "toeic_question_groups" ADD "transcriptEn" text`);
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" ADD "transcriptVi" text`);
        await queryRunner.query(`UPDATE "toeic_question_groups" SET "transcriptVi" = "explanation"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" DROP COLUMN "explanation"`);
    }
}
