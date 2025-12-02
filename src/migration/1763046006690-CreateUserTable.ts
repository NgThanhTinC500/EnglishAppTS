import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1763046006690 implements MigrationInterface {
    name = 'CreateUserTable1763046006690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" DROP CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6"`);
        await queryRunner.query(`ALTER TABLE "answers" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "answers" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "answers" ADD CONSTRAINT "PK_9c32cec6c71e06da0254f2226c6" PRIMARY KEY ("id")`);
    }

}
