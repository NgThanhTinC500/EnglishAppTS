import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1764668064760 implements MigrationInterface {
    name = 'CreateUserTable1764668064760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "orderNumber"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" ADD "orderNumber" integer NOT NULL`);
    }

}
