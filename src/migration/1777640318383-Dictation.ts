import { MigrationInterface, QueryRunner } from "typeorm";

export class Dictation1777640318383 implements MigrationInterface {
    name = 'Dictation1777640318383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "passwordConfirm"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "passwordConfirm" character varying`);
    }

}
