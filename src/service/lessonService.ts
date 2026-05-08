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

    async createLesson(courseId: number, lessonData: Partial<Lesson>): Promise<Lesson> {
        const course = await this.courseRepository.findOne({
            where: { id: courseId }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        const { title } = lessonData;
        const lesson = this.lessonRepository.create({
            title,
            courseId: courseId
        });

        return await this.lessonRepository.save(lesson);
    }

    async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
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
        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
            }
        });

        if (!lesson) {
            throw new AppError("Bài học không tồn tại", 404);
        }

        return lesson;
    }

    async updateLesson(
        courseId: number,
        lessonId: number,
        updateData: Partial<Lesson>
    ): Promise<Lesson> {
        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
                courseId
            }
        });

        if (!lesson) {
            throw new AppError("Bài học không tồn tại", 404);
        }

        Object.assign(lesson, updateData);

        return await this.lessonRepository.save(lesson);
    }

    async deleteLesson(courseId: number, lessonId: number): Promise<void> {
        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
                courseId
            }
        });

        if (!lesson) {
            throw new AppError("Bài học không tồn tại", 404);
        }

        await this.lessonRepository.remove(lesson);
    }
}
