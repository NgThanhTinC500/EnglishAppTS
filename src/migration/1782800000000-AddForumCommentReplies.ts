import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForumCommentReplies1782800000000 implements MigrationInterface {
    name = "AddForumCommentReplies1782800000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "forum_comments" ADD "parent_comment_id" integer`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_forum_comments_parent_comment_id" ON "forum_comments" ("parent_comment_id")`
        );
        await queryRunner.query(
            `ALTER TABLE "forum_comments" ADD CONSTRAINT "FK_forum_comments_parent_comment_id" FOREIGN KEY ("parent_comment_id") REFERENCES "forum_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "forum_comments" DROP CONSTRAINT "FK_forum_comments_parent_comment_id"`
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_forum_comments_parent_comment_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "forum_comments" DROP COLUMN "parent_comment_id"`
        );
    }
}
