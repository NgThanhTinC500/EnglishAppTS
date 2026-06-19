import { z } from "zod";

const questionGroupParamsSchema = z.object({
    questionGroupId: z.coerce.number().int().positive("questionGroupId phải là số nguyên dương"),
}).strict();

const questionParamsSchema = z.object({
    id: z.coerce.number().int().positive("id phải là số nguyên dương"),
}).strict();

const nullableStringSchema = z.string().trim().nullable();

const optionSchema = z.object({
    optionLabel: z.enum(["A", "B", "C", "D"], {
        message: "optionLabel phải là A, B, C hoặc D",
    }),
    contentEn: z.string().trim().min(1, "contentEn là bắt buộc"),
    contentVi: z.string().trim().nullable().optional(),
    isCorrect: z.boolean().optional(),
}).strict();

export const getToeicQuestionsByGroupSchema = z.object({
    params: questionGroupParamsSchema,
});

export const createToeicQuestionSchema = z.object({
    body: z.object({
        questionNumber: z.number().int().positive("questionNumber phải là số nguyên dương"),
        contentEn: nullableStringSchema.optional(),
        contentVi: nullableStringSchema.optional(),
        explanationVi: nullableStringSchema.optional(),
        options: z.array(optionSchema)
            .min(1, "options phải có ít nhất 1 phần tử")
            .max(4, "options không được vượt quá 4 phần tử")
            .refine(
                (options) => options.filter((opt) => opt.isCorrect === true).length === 1,
                {
                    message: "Phải có đúng một lựa chọn được đánh dấu là đáp án đúng (isCorrect: true)",
                }
            ),
    }).strict(),
    params: questionGroupParamsSchema,
});

export const getToeicQuestionByIdSchema = z.object({
    params: questionParamsSchema,
});

export const updateToeicQuestionSchema = z.object({
    body: z.object({
        questionNumber: z.number().int().positive("questionNumber phải là số nguyên dương").optional(),
        contentEn: nullableStringSchema.optional(),
        contentVi: nullableStringSchema.optional(),
        explanationVi: nullableStringSchema.optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "Cần cung cấp ít nhất một trường để cập nhật",
        }
    ),
    params: questionParamsSchema,
});

export const setToeicQuestionCorrectOptionSchema = z.object({
    body: z.object({
        correctOptionId: z.number().int().positive("correctOptionId phải là số nguyên dương"),
    }).strict(),
    params: questionParamsSchema,
});

export const deleteToeicQuestionSchema = z.object({
    params: questionParamsSchema,
});
