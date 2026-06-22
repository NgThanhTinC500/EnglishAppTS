import { MigrationInterface, QueryRunner } from "typeorm";

export class DropQuestionAudioDuration1781750000000 implements MigrationInterface {
    name = "DropQuestionAudioDuration1781750000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "audioDuration"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "audioDuration" integer`);
    }
}
