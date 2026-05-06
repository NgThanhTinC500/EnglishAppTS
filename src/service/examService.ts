import { AppDataSource } from "../data-source";
import { Exam } from "../entity/Exam";
import { Repository } from "typeorm";
import { Question } from "../entity/Question";
import { QuestionOption } from "../entity/QuestionOption";
import * as fs from 'fs';
import * as path from 'path';
import { Topic } from "../entity/Topic";
import { AppError } from "../utils/appError";

export class ExamService {
    private examRepository = AppDataSource.getRepository(Exam);
    private questionRepository = AppDataSource.getRepository(Question);
    private answerRepository = AppDataSource.getRepository(QuestionOption);
    private topicRepository = AppDataSource.getRepository(Topic)

    private splitDictationAnswers(value: string | null | undefined) {
        return (value ?? "")
            .split(",")
            .map(answer => answer.trim())
            .filter(Boolean);
    }

    private maskTranscript(transcript: string | null, correctAnswers: string[]) {
        if (!transcript) return transcript;
        if (transcript.includes("[BLANK]")) return transcript;

        return correctAnswers.reduce((maskedTranscript, answer) => {
            if (!answer) return maskedTranscript;
            const escapedAnswer = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return maskedTranscript.replace(new RegExp(`\\b${escapedAnswer}\\b`, "i"), "[BLANK]");
        }, transcript);
    }

    private toSafeQuestion(question: Question) {
        const correctAnswers = this.splitDictationAnswers(question.dictationAnswer);
        return {
            id: question.id,
            category: question.category,
            type: question.type,
            content: question.content,
            explanation: question.explanation,
            audioUrl: question.audioUrl,
            audioFileName: question.audioFileName,
            audioDuration: question.audioDuration,
            transcript: question.showTranscript
                ? question.transcript
                : this.maskTranscript(question.transcript, correctAnswers),
            showTranscript: question.showTranscript,
            dictationAnswer: question.dictationAnswer,
            options: question.options?.map(option => ({
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

    // Partial
    // tham số examData chứa một phần field của entity Exam
    async createExam(topicId: number, examData: any) {
        const topic = await this.topicRepository.findOne({
            where: { id: topicId }
        });
        if ( !topic ) 
            throw new AppError("Topic not found", 404);
        const { title, duration } = examData;

        const exam = this.examRepository.create({
            title,
            duration,
            topicId
        });

        return this.examRepository.save(exam);
    }

    async getAllExams(topicId: number) {
        return await this.examRepository.find({
            where: { topicId: topicId, isActive: true },
            order: { id: "ASC" }
            // relations: ["questions", "questions.answers"],
        });
    }

    // Service
    async getExamDetail(topicId: number, examId: number) {
        const exam = await this.examRepository.findOne({
            where: { topicId: topicId, id: examId },
            relations: {
                examQuestions: {
                    question: {
                        options: true
                    }
                }
            }
        });
        if (!exam) {
            throw new AppError("Ko co exam", 404)
        }
        return {
            ...exam,
            examQuestions: exam.examQuestions?.map(examQuestion => ({
                ...examQuestion,
                question: this.toSafeQuestion(examQuestion.question)
            })) ?? []
        }
    }

    async toggleExamActive(topicId: number, examId: number) {
        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId }
        });
        if (!exam) {
            throw new AppError("Ko co exam", 404);
        }
        exam.isActive = !exam.isActive;

        return await this.examRepository.save(exam);
    }

    async updateExam(topicId: number, examId: number, updateData: Partial<Exam>) {
        const exam = await this.examRepository.findOne({
            where: { topicId, id: examId }
        });
        if (!exam) {
            throw new AppError("Ko co exam", 404);
        }
        const allowedFields = ["title", "description", "totalQuestions", "duration"];

        const filteredData = Object.fromEntries(
            // Object.entries(updateData) — chuyển object thành mảng [key, value]
            Object.entries(updateData).filter(([key]) =>
                allowedFields.includes(key)
            )
        );

        // copy từ updateData vào exam
        Object.assign(exam, filteredData);
        return await this.examRepository.save(exam);
    }


    async updateQuestion(questionId: number, updateData: Partial<Question>) {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        })

        if (!question) {
            return null;
        }
        // copy từ updateData vào question
        Object.assign(question, updateData);
        return await this.questionRepository.save(question)
    }
    async deleteQuestion(questionId: number): Promise<boolean> {
        const result = await this.questionRepository.delete(questionId);
        // tra ve true neu co it nhat 1 dong dc update
        return result.affected > 0;
    }
    async getExamWithQuestions(examId: number): Promise<Exam | null> {
        return await this.examRepository.findOne({
            where: { id: examId },
            relations: ["questions", "questions.answers"],
            // order: {
            //     questions: {
            //         orderNumber: "ASC"
            //     }
            // }
        });
    }

    // Xóa câu hỏi (bao gồm xóa file audio nếu có)
    async deleteQuestionWithAudio(questionId: number): Promise<boolean> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question) {
            return false;
        }

        // Xóa file audio nếu có
        if (question.audioUrl) {
            try {
                const filePath = path.join(".", question.audioUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted audio file: ${filePath}`);
                }
            } catch (error) {
                console.error(`Failed to delete audio file: ${error}`);
            }
        }

        const result = await this.questionRepository.delete(questionId);
        return result.affected > 0;
    }
    async updateQuestionAudio(
        questionId: number,
        audioUrl: string,
        audioFileName: string,
        audioDuration?: number
    ): Promise<Question | null> {
        const question = await this.questionRepository.findOne({
            where: { id: questionId }
        });

        if (!question) {
            return null;
        }

        // Xóa audio cũ nếu có
        if (question.audioUrl && question.audioUrl !== audioUrl) {
            try {
                const oldFilePath = path.join(".", question.audioUrl);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            } catch (error) {
                console.error(`Failed to delete old audio: ${error}`);
            }
        }

        // Cập nhật audio mới
        question.audioUrl = audioUrl;
        question.audioFileName = audioFileName;
        question.audioDuration = audioDuration;

        return await this.questionRepository.save(question);
    }



}
