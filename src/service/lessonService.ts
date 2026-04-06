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
            throw new AppError("Course not found", 404);
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
            throw new Error("Course not found");
        }

        return await this.lessonRepository.find({
            where: { courseId },

        });
    }

    async getLessonById(lessonId: number): Promise<Lesson> {
        const lesson = await this.lessonRepository.findOne({
            where: {
                id: lessonId,
            }
        });

        if (!lesson) {
            throw new Error("Lesson not found in this course");
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
            throw new Error("Lesson not found in this course");
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
            throw new Error("Lesson not found in this course");
        }

        await this.lessonRepository.remove(lesson);
    }
}