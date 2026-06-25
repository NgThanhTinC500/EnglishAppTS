import { Repository } from "typeorm";
import { AppDataSource } from "../data-source";
import { Lecture } from "../entity/Lectures";
import { Lesson } from "../entity/Lesson";
import { AppError } from "../utils/appError";

export class LectureService {
    private lectureRepository: Repository<Lecture>;
    private lessonRepository: Repository<Lesson>;

    constructor() {
        this.lectureRepository = AppDataSource.getRepository(Lecture);
        this.lessonRepository = AppDataSource.getRepository(Lesson);
    }

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    async createLecture(lessonId: number, lectureData: Partial<Lecture>): Promise<Lecture> {
        this.ensurePositiveInteger(lessonId, "lessonId");
        const title = lectureData.title?.trim();
        const videoUrl = lectureData.videoUrl?.trim();
        if (!title) throw new AppError("Phải có tiêu đề cho bài giảng", 400);
        if (!videoUrl) throw new AppError("Phải có video cho bài giảng", 400);

        const lessonExists = await this.lessonRepository.findOne({
            where: { id: lessonId }
        });

        if (!lessonExists) {
            throw new AppError("Không tìm thấy bài học", 404);
        }

        const lecture = this.lectureRepository.create({
            title,
            videoUrl,
            lessonId
        });

        return await this.lectureRepository.save(lecture);
    }

    async getLecturesByLesson(lessonId: number): Promise<Lecture[]> {
        this.ensurePositiveInteger(lessonId, "lessonId");

        const lessonExists = await this.lessonRepository.exist({
            where: { id: lessonId }
        });

        if (!lessonExists) {
            throw new AppError("Không tìm thấy bài học", 404);
        }

        return await this.lectureRepository.find({
            where: { lessonId },
            order: {
                createdAt: "ASC"
            }
        });
    }

    async getLectureById(lectureId: number): Promise<Lecture> {
        this.ensurePositiveInteger(lectureId, "lectureId");

        const lecture = await this.lectureRepository.findOne({
            where: {
                id: lectureId
            }
        });

        if (!lecture) {
            throw new AppError("Không tìm thấy bài giảng", 404);
        }

        return lecture;
    }

    async updateLecture(
        lectureId: number,
        updateData: Partial<Lecture>
    ): Promise<Lecture> {
        this.ensurePositiveInteger(lectureId, "lectureId");

        const lecture = await this.lectureRepository.findOne({
            where: {
                id: lectureId,
            }
        });

        if (!lecture) {
            throw new AppError("Không tìm thấy bài giảng", 404);
        }

        if (updateData.title !== undefined) {
            const title = updateData.title.trim();
            if (!title) throw new AppError("Phải có tiêu đề cho bài giảng", 400);
            lecture.title = title;
        }
        if (updateData.videoUrl !== undefined) {
            const videoUrl = updateData.videoUrl.trim();
            if (!videoUrl) throw new AppError("Phải có video cho bài giảng", 400);
            lecture.videoUrl = videoUrl;
        }
        if (updateData.lessonId !== undefined) {
            const lessonId = Number(updateData.lessonId);
            this.ensurePositiveInteger(lessonId, "lessonId");
            const lessonExists = await this.lessonRepository.exist({
                where: { id: lessonId }
            });
            if (!lessonExists) {
                throw new AppError("Không tìm thấy bài học", 404);
            }
            lecture.lessonId = lessonId;
        }

        return await this.lectureRepository.save(lecture);
    }

    async deleteLecture(lectureId: number): Promise<void> {
        this.ensurePositiveInteger(lectureId, "lectureId");

        const lecture = await this.lectureRepository.findOne({
            where: {
                id: lectureId,
            }
        });

        if (!lecture) {
            throw new AppError("Không tìm thấy bài giảng", 404);
        }

        await this.lectureRepository.remove(lecture);
    }
}
