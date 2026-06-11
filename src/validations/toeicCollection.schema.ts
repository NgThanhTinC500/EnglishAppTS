import { z } from "zod";

export const createToeicCollectionSchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(1, "Title is required")
            .max(255, "Title must be at most 255 characters"),
        isPublished: z.boolean().optional(),
    }).strict(),
});

export const updateToeicCollectionSchema = z.object({
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
});
