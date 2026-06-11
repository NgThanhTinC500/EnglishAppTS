import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1775011351954 implements MigrationInterface {
    name = 'InitDB1775011351954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_eabd11159a2602e1712593a38b3"`);
        await queryRunner.query(`CREATE TABLE "lessons" ("id" SERIAL NOT NULL, "courseId" integer NOT NULL, "title" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9b9a8d455cac672d262d7275730" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lessons" ADD CONSTRAINT "FK_1a9ff2409a84c76560ae8a92590" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_eabd11159a2602e1712593a38b3" FOREIGN KEY ("sectionId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_eabd11159a2602e1712593a38b3"`);
        await queryRunner.query(`ALTER TABLE "lessons" DROP CONSTRAINT "FK_1a9ff2409a84c76560ae8a92590"`);
        await queryRunner.query(`DROP TABLE "lessons"`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_eabd11159a2602e1712593a38b3" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
