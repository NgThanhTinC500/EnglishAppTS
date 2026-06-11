import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveCorectOptionId1778227702288 implements MigrationInterface {
    name = 'RemoveCorectOptionId1778227702288'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "correctOptionId"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "correctOptionId" integer`);
    }

}
