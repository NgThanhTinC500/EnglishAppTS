import { z } from "zod";
import { ToeicOptionLabel } from "../entity/ToeicQuestionOption";

const questionParamsSchema = z.object({
    questionId: z.coerce.number().int().positive("questionId must be a positive integer"),
}).strict();

const optionParamsSchema = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
}).strict();

export const getToeicQuestionOptionsByQuestionSchema = z.object({
    params: questionParamsSchema,
});

export const createToeicQuestionOptionSchema = z.object({
    body: z.object({
        optionLabel: z.nativeEnum(ToeicOptionLabel),
        contentEn: z
            .string()
            .trim()
            .min(1, "contentEn is required"),
        contentVi: z.string().trim().nullable(),
        isCorrect: z.boolean().default(false),
    }).strict(),
    params: questionParamsSchema,
});

export const getToeicQuestionOptionByIdSchema = z.object({
    params: optionParamsSchema,
});

export const updateToeicQuestionOptionSchema = z.object({
    body: z.object({
        contentEn: z
            .string()
            .trim()
            .min(1, "contentEn is required")
            .optional(),
        contentVi: z.string().trim().nullable().optional(),
        isCorrect: z.boolean().optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required",
        }
    ),
    params: optionParamsSchema,
});

export const deleteToeicQuestionOptionSchema = z.object({
    params: optionParamsSchema,
});
