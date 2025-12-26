import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExamTable1764662997229 implements MigrationInterface {
    name = 'UpdateExamTable1764662997229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD "audioUrl" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "audioFileName" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "audioDuration" integer`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "transcript" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "showTranscript" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "showTranscript"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "transcript"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "audioDuration"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "audioFileName"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "audioUrl"`);
    }

}
