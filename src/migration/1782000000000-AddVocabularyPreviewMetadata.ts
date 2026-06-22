import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVocabularyPreviewMetadata1782000000000 implements MigrationInterface {
    name = "AddVocabularyPreviewMetadata1782000000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" ADD "exampleVi" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP COLUMN "exampleVi"`);
    }
}
