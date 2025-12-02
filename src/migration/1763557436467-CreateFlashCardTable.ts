import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFlashCardTable1763557436467 implements MigrationInterface {
    name = 'CreateFlashCardTable1763557436467'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "flashcards" ("id" SERIAL NOT NULL, "deckId" integer NOT NULL, "front" character varying(255) NOT NULL, "back" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9acf891ec7aaa7ca05c264ea94d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "flashcard_decks" ("id" SERIAL NOT NULL, "userId" uuid, "name" character varying(255) NOT NULL, "description" text, "totalCards" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b7013fe6cf1a9b4dd13e97d01d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "exams" ALTER COLUMN "totalQuestions" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ADD CONSTRAINT "FK_e0c098b77071057333af0686635" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flashcard_decks" DROP CONSTRAINT "FK_e0c098b77071057333af0686635"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3"`);
        await queryRunner.query(`ALTER TABLE "exams" ALTER COLUMN "totalQuestions" SET DEFAULT '20'`);
        await queryRunner.query(`DROP TABLE "flashcard_decks"`);
        await queryRunner.query(`DROP TABLE "flashcards"`);
    }

}
