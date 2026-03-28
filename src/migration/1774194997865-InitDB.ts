import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1774194997865 implements MigrationInterface {
    name = 'InitDB1774194997865'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_cc81d6a354b73698b1a2ebb22eb"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP COLUMN "topicId"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_7d586b5b608c4696234234338b4"`);
        await queryRunner.query(`ALTER TABLE "question_options" DROP CONSTRAINT "PK_13be20e51c0738def32f00cf7d5"`);
        await queryRunner.query(`ALTER TABLE "question_options" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD CONSTRAINT "PK_13be20e51c0738def32f00cf7d5" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "selectedOptionId"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "selectedOptionId" integer`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_7d586b5b608c4696234234338b4" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_7d586b5b608c4696234234338b4"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP COLUMN "selectedOptionId"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD "selectedOptionId" uuid`);
        await queryRunner.query(`ALTER TABLE "question_options" DROP CONSTRAINT "PK_13be20e51c0738def32f00cf7d5"`);
        await queryRunner.query(`ALTER TABLE "question_options" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD CONSTRAINT "PK_13be20e51c0738def32f00cf7d5" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_7d586b5b608c4696234234338b4" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD "topicId" integer`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_cc81d6a354b73698b1a2ebb22eb" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
