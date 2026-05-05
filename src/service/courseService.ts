import { AppDataSource } from "../data-source";
import { Course } from "../entity/Courses";
import { Repository } from "typeorm";

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
        return await this.courseRepository.find();
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
            throw new Error("Course not found");
        }

        return course;
    }

    async updateCourse(id: number, updateData: Partial<Course>): Promise<Course> {
        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new Error("Course not found");
        }

        Object.assign(course, updateData);

        return await this.courseRepository.save(course);
    }

    async deleteCourse(id: number): Promise<void> {
        const course = await this.courseRepository.findOne({
            where: { id }
        });

        if (!course) {
            throw new Error("Course not found");
        }

        await this.courseRepository.remove(course);
    }
}
