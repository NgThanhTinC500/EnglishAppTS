import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVocabularyTranslationAndAudioVariants1781900000000 implements MigrationInterface {
    name = "AddVocabularyTranslationAndAudioVariants1781900000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" ADD "definitionEn" text`);
        await queryRunner.query(`ALTER TABLE "vocabulary" ADD "audioUsUrl" text`);
        await queryRunner.query(`ALTER TABLE "vocabulary" ADD "audioUkUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN "audioUkUrl"`);
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN "audioUsUrl"`);
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN "definitionEn"`);
    }
}
