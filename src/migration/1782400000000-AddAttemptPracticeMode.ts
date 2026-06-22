import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAttemptPracticeMode1782400000000 implements MigrationInterface {
    name = "AddAttemptPracticeMode1782400000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."attempts_practice_mode_enum"
            AS ENUM('grammar', 'listening_check', 'dictation')
        `);
        await queryRunner.query(`
            ALTER TABLE "attempts"
            ADD COLUMN "practiceMode" "public"."attempts_practice_mode_enum"
            NOT NULL DEFAULT 'grammar'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "practiceMode"`);
        await queryRunner.query(`DROP TYPE "public"."attempts_practice_mode_enum"`);
    }
}
