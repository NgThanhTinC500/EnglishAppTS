import { MigrationInterface, QueryRunner } from "typeorm";

export class Forum1780100000000 implements MigrationInterface {
    name = "Forum1780100000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('new_comment')`);
        await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" SERIAL NOT NULL,
                "user_id" uuid NOT NULL,
                "title" character varying(255) NOT NULL,
                "content" text NOT NULL,
                "tags" text array NOT NULL DEFAULT '{}',
                "likes_count" integer NOT NULL DEFAULT 0,
                "comments_count" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_posts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_posts_user_id" ON "posts" ("user_id")`);
        await queryRunner.query(`
            CREATE TABLE "forum_comments" (
                "id" SERIAL NOT NULL,
                "post_id" integer NOT NULL,
                "user_id" uuid NOT NULL,
                "content" text NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_forum_comments" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_forum_comments_post_id" ON "forum_comments" ("post_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_forum_comments_user_id" ON "forum_comments" ("user_id")`);
        await queryRunner.query(`
            CREATE TABLE "forum_post_likes" (
                "id" SERIAL NOT NULL,
                "post_id" integer NOT NULL,
                "user_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_forum_post_likes_post_user" UNIQUE ("post_id", "user_id"),
                CONSTRAINT "PK_forum_post_likes" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_forum_post_likes_post_id" ON "forum_post_likes" ("post_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_forum_post_likes_user_id" ON "forum_post_likes" ("user_id")`);
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" SERIAL NOT NULL,
                "user_id" uuid NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL,
                "payload" jsonb NOT NULL,
                "is_read" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comments" ADD CONSTRAINT "FK_forum_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_comments" ADD CONSTRAINT "FK_forum_comments_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_post_likes" ADD CONSTRAINT "FK_forum_post_likes_post" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "forum_post_likes" ADD CONSTRAINT "FK_forum_post_likes_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "forum_post_likes" DROP CONSTRAINT "FK_forum_post_likes_user"`);
        await queryRunner.query(`ALTER TABLE "forum_post_likes" DROP CONSTRAINT "FK_forum_post_likes_post"`);
        await queryRunner.query(`ALTER TABLE "forum_comments" DROP CONSTRAINT "FK_forum_comments_user"`);
        await queryRunner.query(`ALTER TABLE "forum_comments" DROP CONSTRAINT "FK_forum_comments_post"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_id"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forum_post_likes_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forum_post_likes_post_id"`);
        await queryRunner.query(`DROP TABLE "forum_post_likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forum_comments_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forum_comments_post_id"`);
        await queryRunner.query(`DROP TABLE "forum_comments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_posts_user_id"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    }
}
