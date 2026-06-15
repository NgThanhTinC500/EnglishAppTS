import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForumPostVisibility1781300000000 implements MigrationInterface {
    name = "AddForumPostVisibility1781300000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "posts" ADD "is_visible" boolean NOT NULL DEFAULT true`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "is_visible"`);
    }
}
