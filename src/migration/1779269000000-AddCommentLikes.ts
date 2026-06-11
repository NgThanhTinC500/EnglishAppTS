import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommentLikes1779269000000 implements MigrationInterface {
    name = "AddCommentLikes1779269000000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comment_likes" ("id" SERIAL NOT NULL, "commentId" integer NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_comment_likes_comment_user" UNIQUE ("commentId", "userId"), CONSTRAINT "PK_comment_likes" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_comment_likes_comment" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_comment_likes_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_comment_likes_user"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_comment_likes_comment"`);
        await queryRunner.query(`DROP TABLE "comment_likes"`);
    }
}
