import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendBlogFields1776000000000 implements MigrationInterface {
    name = "ExtendBlogFields1776000000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" ADD "category" character varying(80) NOT NULL DEFAULT 'meo-lam-bai'`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "slug" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "UQ_blogs_slug" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "excerpt" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "coverImage" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD "readingTimeMinutes" integer NOT NULL DEFAULT 5`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "readingTimeMinutes"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "coverImage"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "excerpt"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "UQ_blogs_slug"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "slug"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP COLUMN "category"`);
    }
}
