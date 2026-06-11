import { MigrationInterface, QueryRunner } from "typeorm";

export class SetDefaultUserPhoto1779271000000 implements MigrationInterface {
    name = "SetDefaultUserPhoto1779271000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "photo" SET DEFAULT '/uploads/image/avatar.webp'`);
        await queryRunner.query(`UPDATE "user" SET "photo" = '/uploads/image/avatar.webp' WHERE "photo" IS NULL OR "photo" = ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "photo" DROP DEFAULT`);
    }
}
