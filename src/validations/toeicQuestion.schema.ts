import { z } from "zod";

const questionGroupParamsSchema = z.object({
    questionGroupId: z.coerce
        .number()
        .int()
        .positive("questionGroupId phải là số nguyên dương"),
}).strict();

const questionParamsSchema = z.object({
    id: z.coerce.number().int().positive("id phải là số nguyên dương"),
}).strict();

const nullableStringSchema = z.string().trim().nullable();

const optionSchema = z.object({
    id: z.number().int().positive("id phải là số nguyên dương").optional(),
    optionLabel: z.enum(["A", "B", "C", "D"], {
        message: "optionLabel phải là A, B, C hoặc D",
    }),
    content: z.string().trim().optional().default(""),
    isCorrect: z.boolean().optional(),
}).strict();

const questionOptionsSchema = z.array(optionSchema)
    .min(1, "options phải có ít nhất 1 phần tử")
    .max(4, "options không được vượt quá 4 phần tử")
    .refine(
        (options) => options.filter((opt) => opt.isCorrect === true).length === 1,
        {
            message: "Phải có đúng một lựa chọn được đánh dấu là đáp án đúng (isCorrect: true)",
        }
    );

export const getToeicQuestionsByGroupSchema = z.object({
    params: questionGroupParamsSchema,
});

export const createToeicQuestionSchema = z.object({
    body: z.object({
        questionNumber: z.number().int().positive("questionNumber phải là số nguyên dương"),
        content: nullableStringSchema.optional(),
        explanation: nullableStringSchema.optional(),
        options: questionOptionsSchema,
    }).strict(),
    params: questionGroupParamsSchema,
});

export const getToeicQuestionByIdSchema = z.object({
    params: questionParamsSchema,
});

export const updateToeicQuestionWithOptionsSchema = z.object({
    body: z.object({
        questionNumber: z.number().int().positive("questionNumber phải là số nguyên dương").optional(),
        content: nullableStringSchema.optional(),
        explanation: nullableStringSchema.optional(),
        options: questionOptionsSchema,
    }).strict(),
    params: questionParamsSchema,
});

export const deleteToeicQuestionSchema = z.object({
    params: questionParamsSchema,
});
