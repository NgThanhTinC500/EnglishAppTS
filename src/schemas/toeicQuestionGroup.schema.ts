import { z } from "zod";

const examPartParamsSchema = z.object({
    examPartId: z.coerce.number().int().positive("examPartId must be a positive integer"),
}).strict();

const groupParamsSchema = z.object({
    id: z.coerce.number().int().positive("id must be a positive integer"),
}).strict();

const nullableStringSchema = z.string().trim().nullable();
const nullableDurationSchema = z.number().int().nonnegative("audioDurationSeconds must be a non-negative integer").nullable();

const imageSchema = z.object({
    imageOrder: z.number().int().positive("imageOrder must be a positive integer"),
    imageUrl: z.string().trim().min(1, "imageUrl is required"),
    translationVi: z.string().trim().nullable().optional(),
}).strict();

export const getToeicQuestionGroupsByPartSchema = z.object({
    params: examPartParamsSchema,
});

export const createToeicQuestionGroupSchema = z.object({
    body: z.object({
        groupOrder: z.number().int().positive("groupOrder must be a positive integer"),
        audioUrl: nullableStringSchema.optional(),
        audioDurationSeconds: nullableDurationSchema.optional(),
        transcriptEn: nullableStringSchema.optional(),
        transcriptVi: nullableStringSchema.optional(),
        images: z.array(imageSchema).optional(),
    }).strict(),
    params: examPartParamsSchema,
});

export const getToeicQuestionGroupByIdSchema = z.object({
    params: groupParamsSchema,
});

export const updateToeicQuestionGroupSchema = z.object({
    body: z.object({
        audioUrl: nullableStringSchema.optional(),
        audioDurationSeconds: nullableDurationSchema.optional(),
        transcriptEn: nullableStringSchema.optional(),
        transcriptVi: nullableStringSchema.optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field is required",
        }
    ),
    params: groupParamsSchema,
});

export const deleteToeicQuestionGroupSchema = z.object({
    params: groupParamsSchema,
});
