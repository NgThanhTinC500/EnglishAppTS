import { AppDataSource } from "../data-source";
import { Course } from "../entity/Courses";
import { Repository } from "typeorm";
import { AppError } from "../utils/appError";

export class CourseService {
    private courseRepository: Repository<Course>;

    constructor() {
        this.courseRepository = AppDataSource.getRepository(Course);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private normalizeCoursePayload(courseData: Partial<Course>) {
        const title = courseData.title?.trim();
        const description = courseData.description?.trim();

        if (!title) throw new AppError("Phải có tiêu đề khóa học", 400);
        if (!description) throw new AppError("Phải có mô tả khóa học", 400);

        return {
            title,
            description,
            thumbnailUrl: courseData.thumbnailUrl?.trim() || ""
        };
    }

    async createCourse(courseData: Partial<Course>): Promise<Course> {
        const course = this.courseRepository.create(
            this.normalizeCoursePayload(courseData)
        );
        return await this.courseRepository.save(course);
    }

    async getAllCourses(): Promise<Course[]> {
        return await this.courseRepository.find({
            relations: {
                lessons: {
                    lectures: true,
                },
            },
            order: {
                id: "ASC",
            },
        });
    }

    async getCourseById(id: number): Promise<Course> {
        this.ensurePositiveInteger(id, "courseId");

        const course = await this.courseRepository.findOne({
            where: { id },
            relations: {
                lessons: {
                    lectures: true,
                },
            },
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        return course;
    }

    async updateCourse(id: number, updateData: Partial<Course>): Promise<Course> {
        this.ensurePositiveInteger(id, "courseId");

        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        if (updateData.title !== undefined) {
            const title = updateData.title.trim();
            if (!title) throw new AppError("Phải có tiêu đề khóa học", 400);
            course.title = title;
        }
        if (updateData.description !== undefined) {
            const description = updateData.description.trim();
            if (!description) throw new AppError("Phải có mô tả khóa học", 400);
            course.description = description;
        }
        if (updateData.thumbnailUrl !== undefined) {
            course.thumbnailUrl = updateData.thumbnailUrl?.trim() || "";
        }

        return await this.courseRepository.save(course);
    }

    async deleteCourse(id: number): Promise<void> {
        this.ensurePositiveInteger(id, "courseId");

        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        await this.courseRepository.remove(course);
    }
}
