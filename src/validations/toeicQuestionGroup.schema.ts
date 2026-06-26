import { z } from "zod";

const examPartParamsSchema = z.object({
    examPartId: z.coerce.number().int().positive("examPartId phải là số nguyên dương"),
}).strict();

const groupParamsSchema = z.object({
    id: z.coerce.number().int().positive("id phải là số nguyên dương"),
}).strict();

const nullableStringSchema = z.string().trim().nullable();
const nullableDurationSchema = z.number().int().nonnegative("audioDurationSeconds phải là số nguyên không âm").nullable();

const imageSchema = z.object({
    imageOrder: z.number().int().positive("imageOrder phải là số nguyên dương"),
    imageUrl: z.string().trim().min(1, "imageUrl là bắt buộc"),
    translationVi: z.string().trim().nullable().optional(),
}).strict();

export const getToeicQuestionGroupsByPartSchema = z.object({
    params: examPartParamsSchema,
});

export const createToeicQuestionGroupSchema = z.object({
    body: z.object({
        audioUrl: nullableStringSchema.optional(),
        audioDurationSeconds: nullableDurationSchema.optional(),
        explanation: nullableStringSchema.optional(),
        imageUrls: z.union([z.string().trim(), z.array(z.string().trim())]).optional(),
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
        explanation: nullableStringSchema.optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "Cần cung cấp ít nhất một trường để cập nhật",
        }
    ),
    params: groupParamsSchema,
});

export const deleteToeicQuestionGroupSchema = z.object({
    params: groupParamsSchema,
});
