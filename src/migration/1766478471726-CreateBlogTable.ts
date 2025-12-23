import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBlogTable1766478471726 implements MigrationInterface {
    name = 'CreateBlogTable1766478471726'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "blogs" ("id" SERIAL NOT NULL, "tag" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL, "image" character varying(500), "isPublished" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" uuid, CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_05aa4239904d894452e339e5139" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_05aa4239904d894452e339e5139"`);
        await queryRunner.query(`DROP TABLE "blogs"`);
    }

}
