import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Lesson } from "../entity/Lesson";
import { Course } from "../entity/Courses";
import { AppError } from "../utils/appError";

export class LessonService {
    private lessonRepository: Repository<Lesson>;
    private courseRepository: Repository<Course>;

    constructor() {
        this.lessonRepository = AppDataSource.getRepository(Lesson);
        this.courseRepository = AppDataSource.getRepository(Course);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    async createLesson(courseId: number, lessonData: Partial<Lesson>): Promise<Lesson> {
        this.ensurePositiveInteger(courseId, "courseId");
        const title = lessonData.title?.trim();
        if (!title) throw new AppError("Lesson title is required", 400);

        const course = await this.courseRepository.findOne({
            where: { id: courseId }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        const lesson = this.lessonRepository.create({
            title,
            courseId: courseId
        });

        return await this.lessonRepository.save(lesson);
    }

    async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
        this.ensurePositiveInteger(courseId, "courseId");

        const course = await this.courseRepository.findOne({
            where: { id: courseId }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        return await this.lessonRepository.find({
            where: { courseId },
            relations: {
                lectures: true,
            },
            order: {
                createdAt: "ASC",
                lectures: {
                    createdAt: "ASC",
                },
            },
        });
    }

    async getLessonById(lessonId: number): Promise<Lesson> {
        this.ensurePositiveInteger(lessonId, "lessonId");

        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
            },
            relations: {
                lectures: true
            }
        });

        if (!lesson) {
            throw new AppError("Bài học không tồn tại", 404);
        }

        return lesson;
    }

    async updateLesson(
        lessonId: number,
        updateData: Partial<Lesson>
    ): Promise<Lesson> {
        this.ensurePositiveInteger(lessonId, "lessonId");

        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
            }
        });

        if (!lesson) {
            throw new AppError("Bài học không tồn tại", 404);
        }

        if (updateData.title !== undefined) {
            const title = updateData.title.trim();
            if (!title) throw new AppError("Lesson title is required", 400);
            lesson.title = title;
        }

        return await this.lessonRepository.save(lesson);
    }

    async deleteLesson(lessonId: number): Promise<void> {
        this.ensurePositiveInteger(lessonId, "lessonId");

        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
            }
        });

        if (!lesson) {
            throw new AppError("Bài học không tồn tại", 404);
        }

        await this.lessonRepository.remove(lesson);
    }
}
