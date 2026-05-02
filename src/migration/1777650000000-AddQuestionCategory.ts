import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionCategory1777650000000 implements MigrationInterface {
    name = "AddQuestionCategory1777650000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'questions_category_enum') THEN
                    CREATE TYPE "public"."questions_category_enum" AS ENUM('grammar', 'listening');
                END IF;
            END
            $$;
        `);
        await queryRunner.query(`
            ALTER TABLE "questions"
            ADD COLUMN IF NOT EXISTS "category" "public"."questions_category_enum" NOT NULL DEFAULT 'grammar'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN IF EXISTS "category"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."questions_category_enum"`);
    }
}
