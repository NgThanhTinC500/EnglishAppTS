import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTotalquestionFromExam1774660562633 implements MigrationInterface {
    name = 'RemoveTotalquestionFromExam1774660562633'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "totalQuestions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exams" ADD "totalQuestions" integer NOT NULL`);
    }

}
