import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1774431611517 implements MigrationInterface {
    name = 'InitDB1774431611517'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "correctOptionId" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "correctOptionId"`);
    }

}
