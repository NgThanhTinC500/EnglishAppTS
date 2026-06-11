import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagVocabularySet1777972964785 implements MigrationInterface {
    name = 'AddTagVocabularySet1777972964785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary_sets" ADD "tag" character varying`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "content" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "explanation" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "explanation" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "content" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "vocabulary_sets" DROP COLUMN "tag"`);
    }

}
