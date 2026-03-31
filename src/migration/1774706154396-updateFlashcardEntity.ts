import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFlashcardEntity1774706154396 implements MigrationInterface {
    name = 'UpdateFlashcardEntity1774706154396'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flashcards" DROP COLUMN "front"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP COLUMN "back"`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" DROP COLUMN "totalCards"`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD "word" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD "meaning" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD "pronunciation" character varying`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD "example" character varying`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3"`);
        await queryRunner.query(`ALTER TABLE "flashcards" ALTER COLUMN "deckId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" DROP CONSTRAINT "FK_e0c098b77071057333af0686635"`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ADD CONSTRAINT "FK_e0c098b77071057333af0686635" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "flashcard_decks" DROP CONSTRAINT "FK_e0c098b77071057333af0686635"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3"`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ADD CONSTRAINT "FK_e0c098b77071057333af0686635" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flashcards" ALTER COLUMN "deckId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP COLUMN "example"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP COLUMN "pronunciation"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP COLUMN "meaning"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP COLUMN "word"`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ADD "totalCards" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD "back" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD "front" character varying(255) NOT NULL`);
    }

}
