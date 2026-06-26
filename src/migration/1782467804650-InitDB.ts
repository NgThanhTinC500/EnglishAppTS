import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1782467804650 implements MigrationInterface {
    name = 'InitDB1782467804650'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comments" DROP CONSTRAINT "FK_forum_comments_parent_comment_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_forum_comments_parent_comment_id"`);
        await queryRunner.query(`CREATE INDEX "IDX_588f41364b0390264f349eba5f" ON "forum_comments" ("parent_comment_id") `);
        await queryRunner.query(`ALTER TABLE "forum_comments" ADD CONSTRAINT "FK_588f41364b0390264f349eba5f5" FOREIGN KEY ("parent_comment_id") REFERENCES "forum_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "forum_comments" DROP CONSTRAINT "FK_588f41364b0390264f349eba5f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_588f41364b0390264f349eba5f"`);
        await queryRunner.query(`CREATE INDEX "IDX_forum_comments_parent_comment_id" ON "forum_comments" ("parent_comment_id") `);
        await queryRunner.query(`ALTER TABLE "forum_comments" ADD CONSTRAINT "FK_forum_comments_parent_comment_id" FOREIGN KEY ("parent_comment_id") REFERENCES "forum_comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
