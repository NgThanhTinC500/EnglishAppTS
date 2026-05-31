import { z } from "zod";

const collectionParamsSchema = z.object({
    collectionId: z.coerce.number().int().positive("collectionId must be a positive integer"),
}).strict();

const examSetParamsSchema = collectionParamsSchema.extend({
    id: z.coerce.number().int().positive("id must be a positive integer"),
});

export const getToeicExamSetsSchema = z.object({
    params: collectionParamsSchema,
});

export const getToeicExamSetByIdSchema = z.object({
    params: examSetParamsSchema,
});

export const createToeicExamSetSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Title is required")
            .max(255, "Title must be at most 255 characters"),
        isPublished: z.boolean().default(false),
    }).strict(),
    params: collectionParamsSchema,
});

export const updateToeicExamSetSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Title is required")
            .max(255, "Title must be at most 255 characters")
            .optional(),
        isPublished: z.boolean().optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required",
        }
    ),
    params: examSetParamsSchema,
});

export const deleteToeicExamSetSchema = z.object({
    params: examSetParamsSchema,
});
