import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateVocabularyEntity1774765639685 implements MigrationInterface {
    name = 'UpdateVocabularyEntity1774765639685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vocabulary" ("id" SERIAL NOT NULL, "word" character varying(255) NOT NULL, "meaning" text NOT NULL, "pronunciation" character varying, "example" character varying, "vocabSetId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_65dbd74f76cee79778299a2a21b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vocabulary_sets" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a457bfe9131d0ac2948b1b92109" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "vocabulary" ADD CONSTRAINT "FK_1bee977d09de35d5b1bc5ee236c" FOREIGN KEY ("vocabSetId") REFERENCES "vocabulary_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vocabulary_sets" ADD CONSTRAINT "FK_11e005d6f37630d0a9ad808985a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vocabulary_sets" DROP CONSTRAINT "FK_11e005d6f37630d0a9ad808985a"`);
        await queryRunner.query(`ALTER TABLE "vocabulary" DROP CONSTRAINT "FK_1bee977d09de35d5b1bc5ee236c"`);
        await queryRunner.query(`DROP TABLE "vocabulary_sets"`);
        await queryRunner.query(`DROP TABLE "vocabulary"`);
    }

}
