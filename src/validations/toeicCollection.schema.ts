import { z } from "zod";

export const createToeicCollectionSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Tiêu đề là bắt buộc")
            .max(255, "Tiêu đề không được vượt quá 255 ký tự"),
        isPublished: z.boolean().optional(),
    }).strict(),
});

export const updateToeicCollectionSchema = z.object({
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
});
