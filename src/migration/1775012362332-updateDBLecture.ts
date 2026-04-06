import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDBLecture1775012362332 implements MigrationInterface {
    name = 'UpdateDBLecture1775012362332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_eabd11159a2602e1712593a38b3"`);
        await queryRunner.query(`ALTER TABLE "lectures" RENAME COLUMN "sectionId" TO "lessonId"`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_e2f671240ef4b44c7c289708d7f" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_e2f671240ef4b44c7c289708d7f"`);
        await queryRunner.query(`ALTER TABLE "lectures" RENAME COLUMN "lessonId" TO "sectionId"`);
        await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "FK_eabd11159a2602e1712593a38b3" FOREIGN KEY ("sectionId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
