import { MigrationInterface, QueryRunner } from "typeorm";

export class DropUnusedVocabularyFields1782600000000 implements MigrationInterface {
    name = "DropUnusedVocabularyFields1782600000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN IF EXISTS "definitionEn"`);
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN IF EXISTS "partOfSpeech"`);
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN IF EXISTS "level"`);
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN IF EXISTS "source"`);
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {}
}
