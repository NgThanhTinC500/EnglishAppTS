import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1777648284819 implements MigrationInterface {
    name = 'InitDB1777648284819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "description"`);
        await queryRunner.query(`CREATE TYPE "public"."topics_type_enum" AS ENUM('grammar', 'listening')`);
        await queryRunner.query(`ALTER TABLE "topics" ADD "type" "public"."topics_type_enum" NOT NULL DEFAULT 'grammar'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."topics_type_enum"`);
        await queryRunner.query(`ALTER TABLE "exams" ADD "description" text`);
    }

}
