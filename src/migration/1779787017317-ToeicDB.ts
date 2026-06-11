import { MigrationInterface, QueryRunner } from "typeorm";

export class ToeicDB1779787017317 implements MigrationInterface {
    name = 'ToeicDB1779787017317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_comment_likes_comment"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_comment_likes_user"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "UQ_comment_likes_comment_user"`);
        await queryRunner.query(`CREATE TABLE "toeic_collections" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_3e461b8de9cee990dc196975e78" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "toeic_session_answers" ("id" SERIAL NOT NULL, "sessionId" integer NOT NULL, "questionId" integer NOT NULL, "selectedOptionId" integer, "isCorrect" boolean, "answeredAt" TIMESTAMP WITH TIME ZONE, "timeSpentSeconds" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e8744128289a9c4690bb19b1bbd" UNIQUE ("sessionId", "questionId"), CONSTRAINT "PK_9366ccbe844e1b44cf5815ab3b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."toeic_exam_sessions_status_enum" AS ENUM('in_progress', 'submitted', 'expired')`);
        await queryRunner.query(`CREATE TABLE "toeic_exam_sessions" ("id" SERIAL NOT NULL, "userId" uuid NOT NULL, "examSetId" integer NOT NULL, "status" "public"."toeic_exam_sessions_status_enum" NOT NULL DEFAULT 'in_progress', "currentPartNumber" smallint, "currentQuestionId" integer, "startedAt" TIMESTAMP WITH TIME ZONE, "submittedAt" TIMESTAMP WITH TIME ZONE, "remainingSeconds" integer, "listeningCorrectCount" integer NOT NULL DEFAULT '0', "readingCorrectCount" integer NOT NULL DEFAULT '0', "listeningScore" integer, "readingScore" integer, "totalScore" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_71d458176607ff71fd1c7baca43" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "toeic_exam_sets" ("id" SERIAL NOT NULL, "collectionId" integer NOT NULL, "title" character varying(255) NOT NULL, "isPublished" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_93163f35fb5e78c19669610de5b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "toeic_exam_parts" ("id" SERIAL NOT NULL, "examSetId" integer NOT NULL, "partNumber" smallint NOT NULL, "questionCount" integer NOT NULL, "durationSeconds" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_4e6547454b55ccf78b9bb9b3bcf" UNIQUE ("examSetId", "partNumber"), CONSTRAINT "PK_9831e2e647113d385b14af6b57c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "toeic_question_group_images" ("id" SERIAL NOT NULL, "questionGroupId" integer NOT NULL, "imageOrder" integer NOT NULL, "imageUrl" text NOT NULL, "translationVi" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_a6a4c9f6ad484e31242ff2d3dbc" UNIQUE ("questionGroupId", "imageOrder"), CONSTRAINT "PK_61ee02e15763f8fcc57e74a0535" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "toeic_question_groups" ("id" SERIAL NOT NULL, "examPartId" integer NOT NULL, "groupOrder" integer NOT NULL, "audioUrl" text, "audioDurationSeconds" integer, "transcriptEn" text, "transcriptVi" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_c5700bb3833133710eb9545432c" UNIQUE ("examPartId", "groupOrder"), CONSTRAINT "PK_819643907a7894c701d360d9e9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "toeic_questions" ("id" SERIAL NOT NULL, "questionGroupId" integer NOT NULL, "questionNumber" integer NOT NULL, "contentEn" text, "contentVi" text, "explanationVi" text, "correctOptionId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_67d03f7b62e096ddeecbeb84b71" UNIQUE ("questionGroupId", "questionNumber"), CONSTRAINT "PK_ee1be7442c5309f575de38c81f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."toeic_question_options_optionlabel_enum" AS ENUM('A', 'B', 'C', 'D')`);
        await queryRunner.query(`CREATE TABLE "toeic_question_options" ("id" SERIAL NOT NULL, "questionId" integer NOT NULL, "optionLabel" "public"."toeic_question_options_optionlabel_enum" NOT NULL, "contentEn" text NOT NULL, "contentVi" text, "isCorrect" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_98b8439339d4881dd7d5197859a" UNIQUE ("questionId", "optionLabel"), CONSTRAINT "PK_2c5c810ce65b8845efcd848a316" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "UQ_ec6698ead14ad945033ebb2f1b9" UNIQUE ("commentId", "userId")`);
        await queryRunner.query(`ALTER TABLE "toeic_session_answers" ADD CONSTRAINT "FK_1095b47159cff2a34ce30d78d90" FOREIGN KEY ("sessionId") REFERENCES "toeic_exam_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_session_answers" ADD CONSTRAINT "FK_520f337c9432a0ee6f1503eabfc" FOREIGN KEY ("questionId") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_session_answers" ADD CONSTRAINT "FK_8c9f76d6509223232a1302b762c" FOREIGN KEY ("selectedOptionId") REFERENCES "toeic_question_options"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sessions" ADD CONSTRAINT "FK_df37fd28420e6a8c0c61791155e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sessions" ADD CONSTRAINT "FK_7b3b200cf8a2ac608043bcb3b97" FOREIGN KEY ("examSetId") REFERENCES "toeic_exam_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sessions" ADD CONSTRAINT "FK_4fc44101dfa3df4451a5a6ee5c6" FOREIGN KEY ("currentQuestionId") REFERENCES "toeic_questions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sets" ADD CONSTRAINT "FK_5a4391c3e2cb47519f3356cfde9" FOREIGN KEY ("collectionId") REFERENCES "toeic_collections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_parts" ADD CONSTRAINT "FK_32d291380a540bcba35f8f87951" FOREIGN KEY ("examSetId") REFERENCES "toeic_exam_sets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_question_group_images" ADD CONSTRAINT "FK_078007b81b3ba098d93d8714f02" FOREIGN KEY ("questionGroupId") REFERENCES "toeic_question_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" ADD CONSTRAINT "FK_8a260a0e534eb2d92d6daacdcda" FOREIGN KEY ("examPartId") REFERENCES "toeic_exam_parts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD CONSTRAINT "FK_b69dcd446e3bb0df1490bb7a428" FOREIGN KEY ("questionGroupId") REFERENCES "toeic_question_groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" ADD CONSTRAINT "FK_8cc96466a515c69ce998047fcb6" FOREIGN KEY ("correctOptionId") REFERENCES "toeic_question_options"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" ADD CONSTRAINT "FK_ef54207f2383718753b096c1797" FOREIGN KEY ("questionId") REFERENCES "toeic_questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_abbd506a94a424dd6a3a68d26f4" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_34d1f902a8a527dbc2502f87c88" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_34d1f902a8a527dbc2502f87c88"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "FK_abbd506a94a424dd6a3a68d26f4"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_options" DROP CONSTRAINT "FK_ef54207f2383718753b096c1797"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP CONSTRAINT "FK_8cc96466a515c69ce998047fcb6"`);
        await queryRunner.query(`ALTER TABLE "toeic_questions" DROP CONSTRAINT "FK_b69dcd446e3bb0df1490bb7a428"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_groups" DROP CONSTRAINT "FK_8a260a0e534eb2d92d6daacdcda"`);
        await queryRunner.query(`ALTER TABLE "toeic_question_group_images" DROP CONSTRAINT "FK_078007b81b3ba098d93d8714f02"`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_parts" DROP CONSTRAINT "FK_32d291380a540bcba35f8f87951"`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sets" DROP CONSTRAINT "FK_5a4391c3e2cb47519f3356cfde9"`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sessions" DROP CONSTRAINT "FK_4fc44101dfa3df4451a5a6ee5c6"`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sessions" DROP CONSTRAINT "FK_7b3b200cf8a2ac608043bcb3b97"`);
        await queryRunner.query(`ALTER TABLE "toeic_exam_sessions" DROP CONSTRAINT "FK_df37fd28420e6a8c0c61791155e"`);
        await queryRunner.query(`ALTER TABLE "toeic_session_answers" DROP CONSTRAINT "FK_8c9f76d6509223232a1302b762c"`);
        await queryRunner.query(`ALTER TABLE "toeic_session_answers" DROP CONSTRAINT "FK_520f337c9432a0ee6f1503eabfc"`);
        await queryRunner.query(`ALTER TABLE "toeic_session_answers" DROP CONSTRAINT "FK_1095b47159cff2a34ce30d78d90"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" DROP CONSTRAINT "UQ_ec6698ead14ad945033ebb2f1b9"`);
        await queryRunner.query(`DROP TABLE "toeic_question_options"`);
        await queryRunner.query(`DROP TYPE "public"."toeic_question_options_optionlabel_enum"`);
        await queryRunner.query(`DROP TABLE "toeic_questions"`);
        await queryRunner.query(`DROP TABLE "toeic_question_groups"`);
        await queryRunner.query(`DROP TABLE "toeic_question_group_images"`);
        await queryRunner.query(`DROP TABLE "toeic_exam_parts"`);
        await queryRunner.query(`DROP TABLE "toeic_exam_sets"`);
        await queryRunner.query(`DROP TABLE "toeic_exam_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."toeic_exam_sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "toeic_session_answers"`);
        await queryRunner.query(`DROP TABLE "toeic_collections"`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "UQ_comment_likes_comment_user" UNIQUE ("commentId", "userId")`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_comment_likes_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comment_likes" ADD CONSTRAINT "FK_comment_likes_comment" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
