import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Lecture } from "../entity/Lectures";
import { Lesson } from "../entity/Lesson";

export class LectureService {
    private lectureRepository: Repository<Lecture>;
    private lessonRepository: Repository<Lesson>;

    constructor() {
        this.lectureRepository = AppDataSource.getRepository(Lecture);
        this.lessonRepository = AppDataSource.getRepository(Lesson);
    }

    async createLecture(lessonId: number, lectureData: Partial<Lecture>): Promise<Lecture> {
        const lessonExists = await this.lessonRepository.findOne({
            where: { id: lessonId }
        });

        if (!lessonExists) {
            throw new Error("Lesson not found");
        }

        const lecture = this.lectureRepository.create({
            ...lectureData,
            lessonId
        });

        return await this.lectureRepository.save(lecture);
    }

    async getLecturesByLesson(lessonId: number): Promise<Lecture[]> {
        const lessonExists = await this.lessonRepository.exist({
            where: { id: lessonId }
        });

        if (!lessonExists) {
            throw new Error("Lesson not found");
        }

        return await this.lectureRepository.find({
            where: { lessonId },
            order: {
                createdAt: "ASC"
            }
        });
    }

    async getLectureById(lectureId: number): Promise<Lecture> {
        const lecture = await this.lectureRepository.findOne({
            where: {
                id: lectureId
            }
        });

        if (!lecture) {
            throw new Error("Lecture not found in this lesson");
        }

        return lecture;
    }

    async updateLecture(
        lessonId: number,
        lectureId: number,
        updateData: Partial<Lecture>
    ): Promise<Lecture> {
        const lecture = await this.lectureRepository.findOne({
            where: {
                id: lectureId,
                lessonId
            }
        });

        if (!lecture) {
            throw new Error("Lecture not found in this lesson");
        }

        Object.assign(lecture, updateData);

        return await this.lectureRepository.save(lecture);
    }

    async deleteLecture(lessonId: number, lectureId: number): Promise<void> {
        const lecture = await this.lectureRepository.findOne({
            where: {
                id: lectureId,
                lessonId
            }
        });

        if (!lecture) {
            throw new Error("Lecture not found in this lesson");
        }

        await this.lectureRepository.remove(lecture);
    }
}