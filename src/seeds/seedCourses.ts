import "dotenv/config";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Course } from "../entity/Courses";
import { Lesson } from "../entity/Lesson";
import { Lecture } from "../entity/Lectures";

const SEED_PREFIX = "[Course Seed]";

const COURSE_SEEDS = [
  {
    title: "TOEIC Listening Starter",
    description:
      "Practice TOEIC Listening from the basics: picture description, short questions, office conversations, and announcements.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Part 1: Picture Description",
        lectures: [
          {
            title: "TOEIC Listening Part 1: Picture Description Practice",
            videoUrl: "https://www.youtube.com/watch?v=SaV2m8jtaRI",
          },
          {
            title: "TOEIC Part 1: Common Picture Traps",
            videoUrl: "https://www.youtube.com/watch?v=a65Mg9UEZQo",
          },
        ],
      },
      {
        title: "Part 2: Question Response",
        lectures: [
          {
            title: "TOEIC Listening Part 2: Question Response Practice",
            videoUrl: "https://www.youtube.com/watch?v=De1mtkf3gbU",
          },
          {
            title: "TOEIC Part 2: Short Question Strategy",
            videoUrl: "https://www.youtube.com/watch?v=S-_XynwQIFs",
          },
        ],
      },
    ],
  },
  {
    title: "TOEIC Reading Grammar Core",
    description:
      "Core grammar for TOEIC Reading Part 5 and Part 6: word forms, clauses, tenses, prepositions, and connectors.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Part 5: Sentence Completion",
        lectures: [
          {
            title: "TOEIC Reading Part 5: Grammar Practice",
            videoUrl: "https://www.youtube.com/watch?v=AVRPPa4UQ5I",
          },
          {
            title: "TOEIC Part 5: Word Form and Grammar Tips",
            videoUrl: "https://www.youtube.com/watch?v=CfLv_B3VFlA",
          },
        ],
      },
      {
        title: "Part 6: Text Completion",
        lectures: [
          {
            title: "TOEIC Reading Part 6: Text Completion Practice",
            videoUrl: "https://www.youtube.com/watch?v=mxknneAjpYs",
          },
          {
            title: "TOEIC Part 6: Context and Sentence Insertion",
            videoUrl: "https://www.youtube.com/watch?v=w7HfDtaUF8E",
          },
        ],
      },
    ],
  },
  {
    title: "Business English Vocabulary",
    description:
      "Workplace vocabulary for meetings, email, invoices, shipping, hiring, and customer service.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Office Communication",
        lectures: [
          {
            title: "Business English: Meeting Vocabulary",
            videoUrl: "https://www.youtube.com/watch?v=I-DiPTWUxyg",
          },
          {
            title: "Business English: Professional Office Phrases",
            videoUrl: "https://www.youtube.com/watch?v=B-JDi7W7-Qk",
          },
        ],
      },
      {
        title: "Operations and Finance",
        lectures: [
          {
            title: "Business English: Invoice Vocabulary",
            videoUrl: "https://www.youtube.com/watch?v=s1vtM_g6rpE",
          },
          {
            title: "Business English: Payment and Order Vocabulary",
            videoUrl: "https://www.youtube.com/watch?v=5Y-nJywmW1E",
          },
        ],
      },
    ],
  },
  {
    title: "TOEIC Reading Speed Practice",
    description:
      "Improve TOEIC Reading Part 7 speed with emails, notices, advertisements, articles, and multiple passages.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Single Passage Strategy",
        lectures: [
          {
            title: "TOEIC Reading Part 7: Single Passage Strategy",
            videoUrl: "https://www.youtube.com/watch?v=F638wYhbpRs",
          },
          {
            title: "TOEIC Part 7: Skimming and Scanning",
            videoUrl: "https://www.youtube.com/watch?v=zQvRCEUHHpc",
          },
        ],
      },
      {
        title: "Multiple Passage Strategy",
        lectures: [
          {
            title: "TOEIC Part 7: Multiple Passage Practice",
            videoUrl: "https://www.youtube.com/watch?v=fnZULBI_7Nk",
          },
          {
            title: "TOEIC Part 7: Inference and Paraphrase",
            videoUrl: "https://www.youtube.com/watch?v=XOfz4MgQpsU",
          },
        ],
      },
    ],
  },
  {
    title: "Workplace Speaking and Pronunciation",
    description:
      "Practice pronunciation and short workplace speaking tasks: introductions, scheduling, requests, and polite responses.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Clear Workplace Pronunciation",
        lectures: [
          {
            title: "English Pronunciation: Word Stress Practice",
            videoUrl: "https://www.youtube.com/watch?v=Vu6UVwkUgzc",
          },
          {
            title: "English Pronunciation: Connected Speech",
            videoUrl: "https://www.youtube.com/watch?v=gAHUTKm_1n0",
          },
        ],
      },
      {
        title: "Everyday Office Dialogues",
        lectures: [
          {
            title: "Workplace English: Scheduling a Meeting",
            videoUrl: "https://www.youtube.com/watch?v=PLhAzAymMsY",
          },
          {
            title: "Workplace English: Requests and Polite Responses",
            videoUrl: "https://www.youtube.com/watch?v=QWBwCoecvkM",
          },
        ],
      },
    ],
  },
];

async function removeExistingSeedCourses(manager: EntityManager) {
  const existingCourses = await manager
    .getRepository(Course)
    .createQueryBuilder("course")
    .where("course.title LIKE :title", { title: `${SEED_PREFIX}%` })
    .getMany();

  if (existingCourses.length > 0) {
    await manager.remove(Course, existingCourses);
  }
}

export async function seedCourses() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.transaction(async (manager) => {
    await removeExistingSeedCourses(manager);

    for (const courseSeed of COURSE_SEEDS) {
      const course = await manager.save(
        manager.create(Course, {
          title: `${SEED_PREFIX} ${courseSeed.title}`,
          description: courseSeed.description,
          thumbnailUrl: courseSeed.thumbnailUrl,
        })
      );

      for (const lessonSeed of courseSeed.lessons) {
        const lesson = await manager.save(
          manager.create(Lesson, {
            courseId: course.id,
            title: lessonSeed.title,
          })
        );

        for (const lectureSeed of lessonSeed.lectures) {
          await manager.save(
            manager.create(Lecture, {
              lessonId: lesson.id,
              title: lectureSeed.title,
              videoUrl: lectureSeed.videoUrl,
            })
          );
        }
      }
    }
  });

  const totalSeedCourses = await AppDataSource.getRepository(Course)
    .createQueryBuilder("course")
    .where("course.title LIKE :title", { title: `${SEED_PREFIX}%` })
    .getCount();

  console.log(`[course-seed] Seeded courses: ${totalSeedCourses}`);
}

if (require.main === module) {
  seedCourses()
    .then(async () => {
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(error);
      if (AppDataSource.isInitialized) await AppDataSource.destroy();
      process.exit(1);
    });
}
