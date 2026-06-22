import { z } from "zod";

const collectionParamsSchema = z.object({
    collectionId: z.coerce.number().int().positive("collectionId phải là số nguyên dương"),
}).strict();

const examSetParamsSchema = collectionParamsSchema.extend({
    id: z.coerce.number().int().positive("id phải là số nguyên dương"),
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
            .min(1, "Tiêu đề là bắt buộc")
            .max(255, "Tiêu đề không được vượt quá 255 ký tự"),
        isPublished: z.boolean().default(false),
    }).strict(),
    params: collectionParamsSchema,
});

export const updateToeicExamSetSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Tiêu đề là bắt buộc")
            .max(255, "Tiêu đề không được vượt quá 255 ký tự")
            .optional(),
        isPublished: z.boolean().optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "Cần cung cấp ít nhất một trường để cập nhật",
        }
    ),
    params: examSetParamsSchema,
});

export const deleteToeicExamSetSchema = z.object({
    params: examSetParamsSchema,
});
