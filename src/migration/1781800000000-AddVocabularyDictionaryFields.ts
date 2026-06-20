import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVocabularyDictionaryFields1781800000000 implements MigrationInterface {
    name = "AddVocabularyDictionaryFields1781800000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" ADD "audioUrl" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN "audioUrl"`);
    }
}
