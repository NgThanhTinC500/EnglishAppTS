import "dotenv/config";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";
import { Course } from "../entity/Courses";
import { Lesson } from "../entity/Lesson";
import { Lecture } from "../entity/Lectures";

const SEED_PREFIX = "[Course Seed]";

const PUBLIC_YOUTUBE_URLS = [
  "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "https://www.youtube.com/watch?v=ysz5S6PUM-U",
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
];

const COURSE_SEEDS = [
  {
    title: "TOEIC Listening Starter",
    description:
      "Lộ trình nghe TOEIC cho người mới: nhận diện tranh, câu hỏi ngắn, hội thoại công sở và thông báo thường gặp.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Part 1: Picture Description",
        lectures: [
          "Nhận diện hành động chính trong tranh",
          "Bẫy vị trí, đồ vật và thì tiếp diễn",
        ],
      },
      {
        title: "Part 2: Question Response",
        lectures: [
          "Phân biệt When, Where, Who, Why",
          "Chiến thuật nghe keyword đầu câu",
        ],
      },
    ],
  },
  {
    title: "TOEIC Reading Grammar Core",
    description:
      "Khóa học ngữ pháp trọng tâm cho Part 5 và Part 6: loại từ, mệnh đề, thì, giới từ và liên từ.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Part 5: Sentence Completion",
        lectures: [
          "Cách nhìn chỗ trống để đoán loại từ",
          "Cụm giới từ và trạng từ hay gặp",
        ],
      },
      {
        title: "Part 6: Text Completion",
        lectures: [
          "Đọc ngữ cảnh trước và sau chỗ trống",
          "Câu chèn đoạn và liên kết ý",
        ],
      },
    ],
  },
  {
    title: "Business English Vocabulary",
    description:
      "Từ vựng tiếng Anh công sở theo chủ đề meeting, invoice, shipping, hiring và customer service.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Office Communication",
        lectures: [
          "Từ vựng email và meeting",
          "Cụm động từ dùng trong công việc",
        ],
      },
      {
        title: "Operations and Finance",
        lectures: [
          "Invoice, receipt và purchase order",
          "Shipping, warehouse và delivery",
        ],
      },
    ],
  },
  {
    title: "TOEIC Reading Speed Practice",
    description:
      "Luyện đọc nhanh cho Part 7 với email, notice, advertisement, article và double passages.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Single Passage Strategy",
        lectures: [
          "Skimming tiêu đề và mục đích văn bản",
          "Scanning tên riêng, ngày giờ và số liệu",
        ],
      },
      {
        title: "Multiple Passage Strategy",
        lectures: [
          "Nối thông tin giữa email và form",
          "Câu hỏi suy luận và paraphrase",
        ],
      },
    ],
  },
  {
    title: "Workplace Speaking and Pronunciation",
    description:
      "Bổ trợ phát âm và phản xạ nói trong môi trường công việc: giới thiệu, hẹn lịch, hỏi thông tin và xác nhận yêu cầu.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    lessons: [
      {
        title: "Clear Workplace Pronunciation",
        lectures: [
          "Word stress trong từ vựng công sở",
          "Nối âm trong câu giao tiếp ngắn",
        ],
      },
      {
        title: "Everyday Office Dialogues",
        lectures: [
          "Đặt lịch họp và xác nhận thời gian",
          "Yêu cầu hỗ trợ và phản hồi lịch sự",
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

    for (let courseIndex = 0; courseIndex < COURSE_SEEDS.length; courseIndex += 1) {
      const courseSeed = COURSE_SEEDS[courseIndex];
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

        for (let lectureIndex = 0; lectureIndex < lessonSeed.lectures.length; lectureIndex += 1) {
          await manager.save(
            manager.create(Lecture, {
              lessonId: lesson.id,
              title: lessonSeed.lectures[lectureIndex],
              videoUrl:
                PUBLIC_YOUTUBE_URLS[
                  (courseIndex + lectureIndex) % PUBLIC_YOUTUBE_URLS.length
                ],
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
