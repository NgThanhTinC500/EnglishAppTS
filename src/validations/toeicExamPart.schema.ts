import { z } from "zod";

const examSetParamsSchema = z.object({
    examSetId: z.coerce.number().int().positive("examSetId must be a positive integer"),
}).strict();

const partParamsSchema = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
}).strict();

export const getToeicExamPartsByExamSetSchema = z.object({
    params: examSetParamsSchema,
});

export const createToeicExamPartSchema = z.object({
    body: z.object({
        partNumber: z.number().int().min(1, "partNumber must be from 1 to 7").max(7, "partNumber must be from 1 to 7"),
        questionCount: z.number().int().positive("questionCount must be a positive integer"),
        durationSeconds: z.number().int().nonnegative("durationSeconds must be a non-negative integer").nullable().optional(),
    }).strict(),
    params: examSetParamsSchema,
});

export const getToeicExamPartByIdSchema = z.object({
    params: partParamsSchema,
});

export const updateToeicExamPartSchema = z.object({
    body: z.object({
        questionCount: z.number().int().positive("questionCount must be a positive integer").optional(),
        durationSeconds: z.number().int().nonnegative("durationSeconds must be a non-negative integer").nullable().optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required",
        }
    ),
    params: partParamsSchema,
});

export const deleteToeicExamPartSchema = z.object({
    params: partParamsSchema,
});
