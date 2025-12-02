import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1763048093915 implements MigrationInterface {
    name = 'CreateUserTable1763048093915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" ALTER COLUMN "explanation" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answers" ALTER COLUMN "explanation" SET NOT NULL`);
    }

}
