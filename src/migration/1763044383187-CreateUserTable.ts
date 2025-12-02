import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1763044383187 implements MigrationInterface {
    name = 'CreateUserTable1763044383187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_32cd92f2cd6b9438d6425bff0b8"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "PK_b43159ee3efa440952794b4f53e"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "exams" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_c38697a57844f52584abdb878d7"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "questionId"`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "questionId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "examId"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "examId" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_c38697a57844f52584abdb878d7" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_32cd92f2cd6b9438d6425bff0b8" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_32cd92f2cd6b9438d6425bff0b8"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "FK_c38697a57844f52584abdb878d7"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "examId"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "examId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "questionId"`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "questionId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "FK_c38697a57844f52584abdb878d7" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "PK_b43159ee3efa440952794b4f53e"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "exams" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_32cd92f2cd6b9438d6425bff0b8" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
