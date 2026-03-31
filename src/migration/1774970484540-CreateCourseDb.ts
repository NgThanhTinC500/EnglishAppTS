import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCourseDb1774970484540 implements MigrationInterface {
    name = 'CreateCourseDb1774970484540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "courses" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "thumbnailUrl" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sections" ("id" SERIAL NOT NULL, "courseId" integer NOT NULL, "title" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9749dd3bffd880a497d007e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "lectures" ("id" SERIAL NOT NULL, "sectionId" integer NOT NULL, "title" character varying NOT NULL, "videoUrl" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0fbf04287eb4e401af19caf7677" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sections" ADD CONSTRAINT "FK_0fc0dc8ce98e7dc47c273f85e3d" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_eabd11159a2602e1712593a38b3" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_eabd11159a2602e1712593a38b3"`);
        await queryRunner.query(`ALTER TABLE "sections" DROP CONSTRAINT "FK_0fc0dc8ce98e7dc47c273f85e3d"`);
        await queryRunner.query(`DROP TABLE "lectures"`);
        await queryRunner.query(`DROP TABLE "sections"`);
        await queryRunner.query(`DROP TABLE "courses"`);
    }

}
