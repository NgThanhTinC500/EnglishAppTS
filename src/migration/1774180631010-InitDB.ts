import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDB1774180631010 implements MigrationInterface {
    name = 'InitDB1774180631010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "flashcards" ("id" SERIAL NOT NULL, "deckId" integer NOT NULL, "front" character varying(255) NOT NULL, "back" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9acf891ec7aaa7ca05c264ea94d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "flashcard_decks" ("id" SERIAL NOT NULL, "userId" uuid, "name" character varying(255) NOT NULL, "description" text, "totalCards" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b7013fe6cf1a9b4dd13e97d01d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blogs" ("id" SERIAL NOT NULL, "tag" character varying(255) NOT NULL, "title" character varying(255) NOT NULL, "content" text NOT NULL, "image" character varying(500), "isPublished" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" uuid NOT NULL, CONSTRAINT "PK_e113335f11c926da929a625f118" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "question_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "questionId" integer NOT NULL, "label" character varying NOT NULL, "content" text NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_13be20e51c0738def32f00cf7d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."questions_type_enum" AS ENUM('single_choice')`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" SERIAL NOT NULL, "type" "public"."questions_type_enum" NOT NULL DEFAULT 'single_choice', "content" text NOT NULL, "explanation" text NOT NULL, "audioUrl" character varying(255), "audioFileName" character varying(255), "audioDuration" integer, "transcript" text, "showTranscript" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exam_questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "examId" integer NOT NULL, "questionId" integer NOT NULL, "orderIndex" integer NOT NULL, CONSTRAINT "UQ_24245d22d28376773fa65e8ed0c" UNIQUE ("examId", "questionId"), CONSTRAINT "PK_a214d47c7964cb6356f413dc73c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exams" ("id" SERIAL NOT NULL, "topicId" integer NOT NULL, "title" character varying NOT NULL, "description" text, "totalQuestions" integer NOT NULL, "duration" integer NOT NULL DEFAULT '60', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "topics" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attempt_answers_result_enum" AS ENUM('unchecked', 'correct', 'wrong')`);
        await queryRunner.query(`CREATE TABLE "attempt_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attemptId" integer NOT NULL, "questionId" integer NOT NULL, "selectedOptionId" uuid, "result" "public"."attempt_answers_result_enum" NOT NULL DEFAULT 'unchecked', "answeredAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7166de359382219e40c62607be0" UNIQUE ("attemptId", "questionId"), CONSTRAINT "PK_b5f6f0c32809f5b14da916e6f06" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attempts_mode_enum" AS ENUM('practice', 'exam')`);
        await queryRunner.query(`CREATE TYPE "public"."attempts_status_enum" AS ENUM('in_progress', 'submitted', 'expired')`);
        await queryRunner.query(`CREATE TABLE "attempts" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "mode" "public"."attempts_mode_enum" NOT NULL, "topicId" integer, "examId" integer, "status" "public"."attempts_status_enum" NOT NULL DEFAULT 'in_progress', "startedAt" TIMESTAMP, "submittedAt" TIMESTAMP, "totalQuestions" integer NOT NULL DEFAULT '0', "correctCount" integer NOT NULL DEFAULT '0', "score" numeric(5,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_295ca261e361fd2fd217754dcac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "photo" character varying, "password" character varying NOT NULL, "passwordConfirm" character varying, "role" "public"."user_role_enum" NOT NULL DEFAULT 'user', "isActive" boolean NOT NULL DEFAULT true, "passwordChangedAt" TIMESTAMP, "passwordResetToken" text, "passwordResetExpires" TIMESTAMP, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "flashcards" ADD CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3" FOREIGN KEY ("deckId") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" ADD CONSTRAINT "FK_e0c098b77071057333af0686635" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blogs" ADD CONSTRAINT "FK_05aa4239904d894452e339e5139" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_options" ADD CONSTRAINT "FK_c654af7759a681f1b1addbe35bf" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_questions" ADD CONSTRAINT "FK_ecf1b78afe040b8995707914c49" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_questions" ADD CONSTRAINT "FK_c3ee6690f20e2d2d269f2e9ebd7" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_8d59371fda4624cbdde7c485c8e" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_76e6a7dc4c1894250800077e79b" FOREIGN KEY ("attemptId") REFERENCES "attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_382ef7a450def2331b236e49268" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" ADD CONSTRAINT "FK_7d586b5b608c4696234234338b4" FOREIGN KEY ("selectedOptionId") REFERENCES "question_options"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_a6abb83b4ea66267571e4315a9c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_cc81d6a354b73698b1a2ebb22eb" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attempts" ADD CONSTRAINT "FK_ecbc6da13dc8956e9ebb313e874" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_ecbc6da13dc8956e9ebb313e874"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_cc81d6a354b73698b1a2ebb22eb"`);
        await queryRunner.query(`ALTER TABLE "attempts" DROP CONSTRAINT "FK_a6abb83b4ea66267571e4315a9c"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_7d586b5b608c4696234234338b4"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_382ef7a450def2331b236e49268"`);
        await queryRunner.query(`ALTER TABLE "attempt_answers" DROP CONSTRAINT "FK_76e6a7dc4c1894250800077e79b"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_8d59371fda4624cbdde7c485c8e"`);
        await queryRunner.query(`ALTER TABLE "exam_questions" DROP CONSTRAINT "FK_c3ee6690f20e2d2d269f2e9ebd7"`);
        await queryRunner.query(`ALTER TABLE "exam_questions" DROP CONSTRAINT "FK_ecf1b78afe040b8995707914c49"`);
        await queryRunner.query(`ALTER TABLE "question_options" DROP CONSTRAINT "FK_c654af7759a681f1b1addbe35bf"`);
        await queryRunner.query(`ALTER TABLE "blogs" DROP CONSTRAINT "FK_05aa4239904d894452e339e5139"`);
        await queryRunner.query(`ALTER TABLE "flashcard_decks" DROP CONSTRAINT "FK_e0c098b77071057333af0686635"`);
        await queryRunner.query(`ALTER TABLE "flashcards" DROP CONSTRAINT "FK_3a8fb45d6c8da92b5c3e2e390c3"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
        await queryRunner.query(`DROP TABLE "attempts"`);
        await queryRunner.query(`DROP TYPE "public"."attempts_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."attempts_mode_enum"`);
        await queryRunner.query(`DROP TABLE "attempt_answers"`);
        await queryRunner.query(`DROP TYPE "public"."attempt_answers_result_enum"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP TABLE "exams"`);
        await queryRunner.query(`DROP TABLE "exam_questions"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TYPE "public"."questions_type_enum"`);
        await queryRunner.query(`DROP TABLE "question_options"`);
        await queryRunner.query(`DROP TABLE "blogs"`);
        await queryRunner.query(`DROP TABLE "flashcard_decks"`);
        await queryRunner.query(`DROP TABLE "flashcards"`);
    }

}
