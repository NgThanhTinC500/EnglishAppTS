import { AppDataSource } from "../data-source";
import { Course } from "../entity/Courses";
import { Repository } from "typeorm";
import { AppError } from "../utils/appError";

export class CourseService {
    private courseRepository: Repository<Course>;

    constructor() {
        this.courseRepository = AppDataSource.getRepository(Course);
    }

    async createCourse(courseData: Partial<Course>): Promise<Course> {
        const course = this.courseRepository.create(courseData);
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
        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        Object.assign(course, updateData);

        return await this.courseRepository.save(course);
    }

    async deleteCourse(id: number): Promise<void> {
        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new AppError("Khóa học không tồn tại", 404);
        }

        await this.courseRepository.remove(course);
    }
}
