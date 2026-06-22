import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { Question } from "../entity/Question";
import { Topic } from "../entity/Topic";
import { AppError } from "../utils/appError";

export class ExamService {
    private examRepository = AppDataSource.getRepository(Exam);
    private topicRepository = AppDataSource.getRepository(Topic);

    private ensurePositiveInteger(value: number, fieldName: string) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new AppError(`${fieldName} must be a positive integer`, 400);
        }
    }

    private escapeRegExp(value: string) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    private splitDictationAnswers(value: string | null | undefined) {
        return (value ?? "")
            .split(",")
            .map((answer) => answer.trim())
            .filter(Boolean);
    }

    /*
    ẩn đáp án dictation trong transcript bằng cách thay đáp án đúng thành [BLANK].
        transcript = "The boy is drinking coffee"
        correctAnswers = ["boy", "drinking", "coffee"]
        return
        The [BLANK] is [BLANK] [BLANK]
    */
    private maskTranscript(transcript: string | null, correctAnswers: string[]) {
        if (!transcript) return transcript;
        if (transcript.includes("[BLANK]")) return transcript;

        return correctAnswers.reduce((maskedTranscript, answer) => {
            if (!answer) return maskedTranscript;

            const escapedAnswer = this.escapeRegExp(answer);
            const pattern = new RegExp(`(^|[\\s.,!?;:"'()])(${escapedAnswer})(?=$|[\\s.,!?;:"'()])`, "i");

            return maskedTranscript.replace(pattern, (_match, prefix) => `${prefix}[BLANK]`);
        }, transcript);
    }

    private toAdminQuestion(question: Question) {
        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);

        return {
            id: question.id,
            category: question.category,
            type: question.type,
            content: question.content,
            explanation: question.explanation,
            audioUrl: question.audioUrl,
            audioFileName: question.audioFileName,
            transcript: question.showTranscript
                ? question.transcript
                : this.maskTranscript(question.transcript, correctAnswers),
            showTranscript: question.showTranscript,
            dictationAnswer: question.dictationAnswer,
            options: question.options?.map((option) => ({
                id: option.id,
                questionId: option.questionId,
                label: option.label,
                content: option.content,
                isCorrect: option.isCorrect
            })) ?? [],
            createdAt: question.createdAt,
            updatedAt: question.updatedAt
        };
    }

    async createExam(topicId: number, examData: Pick<Exam, "title">) {
        this.ensurePositiveInteger(topicId, "topicId");

        const title = String(examData.title ?? "").trim();
        if (!title) throw new AppError("Bắt buộc có tiêu đề đề thi", 400);

        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });
        if (!topic) throw new AppError("Không tìm thấy đề tài", 404);

        const exam = this.examRepository.create({
            title,
            topicId
        });

        return this.examRepository.save(exam);
    }

    async getAllExams(topicId: number) {
        this.ensurePositiveInteger(topicId, "topicId");

        return this.examRepository.find({
            where: { topicId, isActive: true },
            order: { id: "ASC" }
        });
    }

    async getExamDetail(topicId: number, examId: number) {
        this.ensurePositiveInteger(topicId, "topicId");
        this.ensurePositiveInteger(examId, "examId");

        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId },
            relations: {
                examQuestions: {
                    question: {
                        options: true
                    }
                }
            }
        });

        if (!exam) throw new AppError("Không tìm thấy đề thi", 404);

        const { examQuestions, ...examInfo } = exam;

        return {
            ...examInfo,
            questions: examQuestions
                .filter((examQuestion) => examQuestion.question)
                .sort((first, second) => first.orderIndex - second.orderIndex)
                .map((examQuestion) => ({
                    orderIndex: examQuestion.orderIndex,
                    ...this.toAdminQuestion(examQuestion.question)
                }))
        };
    }

    async toggleExamActive(topicId: number, examId: number) {
        this.ensurePositiveInteger(topicId, "topicId");
        this.ensurePositiveInteger(examId, "examId");

        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId }
        });
        if (!exam) throw new AppError("Không tìm thấy đề thi", 404);

        exam.isActive = !exam.isActive;

        return this.examRepository.save(exam);
    }

    async updateExam(
        topicId: number,
        examId: number,
        updateData: Partial<Exam>
    ) {
        this.ensurePositiveInteger(topicId, "topicId");
        this.ensurePositiveInteger(examId, "examId");

        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId }
        });

        if (!exam) throw new AppError("Không tìm thấy đề thi", 404);

        const allowedFields: (keyof Exam)[] = [
            "title",
            "isActive"
        ];

        const filteredData = Object.fromEntries(
            Object.entries(updateData).filter(
                ([key, value]) =>
                    allowedFields.includes(key as keyof Exam) &&
                    value !== undefined
            )
        ) as Partial<Exam>;

        if ("title" in filteredData) {
            const title = String(filteredData.title ?? "").trim();
            if (!title) throw new AppError("Bắt buộc có tiêu đề đề thi", 400);
            filteredData.title = title;
        }

        Object.assign(exam, filteredData);

        return this.examRepository.save(exam);
    }
}
