import { z } from "zod";

const questionGroupParamsSchema = z.object({
    questionGroupId: z.coerce.number().int().positive("questionGroupId must be a positive integer"),
}).strict();

const questionParamsSchema = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
}).strict();

const nullableStringSchema = z.string().trim().nullable();

const optionSchema = z.object({
    optionLabel: z.enum(["A", "B", "C", "D"], {
        message: "optionLabel must be A, B, C, or D",
    }),
    contentEn: z.string().trim().min(1, "contentEn is required"),
    contentVi: z.string().trim().nullable().optional(),
    isCorrect: z.boolean().optional(),
}).strict();

export const getToeicQuestionsByGroupSchema = z.object({
    params: questionGroupParamsSchema,
});

export const createToeicQuestionSchema = z.object({
    body: z.object({
        questionNumber: z.number().int().positive("questionNumber must be a positive integer"),
        contentEn: nullableStringSchema.optional(),
        contentVi: nullableStringSchema.optional(),
        explanationVi: nullableStringSchema.optional(),
        options: z.array(optionSchema)
            .min(1, "options must have at least 1 item")
            .max(4, "options cannot exceed 4 items")
            .refine(
                (options) => options.filter((opt) => opt.isCorrect === true).length === 1,
                {
                    message: "Exactly one option must be marked as correct (isCorrect: true)",
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
        questionNumber: z.number().int().positive("questionNumber must be a positive integer").optional(),
        contentEn: nullableStringSchema.optional(),
        contentVi: nullableStringSchema.optional(),
        explanationVi: nullableStringSchema.optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required",
        }
    ),
    params: questionParamsSchema,
});

export const setToeicQuestionCorrectOptionSchema = z.object({
    body: z.object({
        correctOptionId: z.number().int().positive("correctOptionId must be a positive integer"),
    }).strict(),
    params: questionParamsSchema,
});

export const deleteToeicQuestionSchema = z.object({
    params: questionParamsSchema,
});
