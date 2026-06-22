import { z } from "zod";

const nullableTextSchema = z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .optional();

export const createVocabularySetSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(1, "Phải có tên bộ từ vựng")
            .max(255, "Tên bộ từ vựng không được vượt quá 255 ký tự"),
        tag: z
            .string()
            .trim()
            .min(1, "Phải có tag cho bộ từ vựng")
            .max(255, "Tag không được vượt quá 255 ký tự"),
    }).strict(),
});

export const updateVocabularySetSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(1, "Phải có tên bộ từ vựng")
            .max(255, "Tên bộ từ vựng không được vượt quá 255 ký tự")
            .optional(),
        tag: z
            .string()
            .trim()
            .min(1, "Phải có tag cho bộ từ vựng")
            .max(255, "Tag không được vượt quá 255 ký tự")
            .optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        { message: "Cần cung cấp ít nhất một trường để cập nhật" }
    ),
});

export const createVocabularySchema = z.object({
    body: z.object({
        word: z
            .string()
            .trim()
            .min(1, "Phải nhập từ cần thêm")
            .max(255, "Từ vựng không được vượt quá 255 ký tự"),
        meaning: z
            .string()
            .trim()
            .min(1, "Phải nhập nghĩa của từ"),
        pronunciation: nullableTextSchema,
        audioUrl: nullableTextSchema,
        audioUsUrl: nullableTextSchema,
        audioUkUrl: nullableTextSchema,
        example: nullableTextSchema,
        exampleVi: nullableTextSchema,
    }).strict(),
});

export const updateVocabularySchema = z.object({
    body: z.object({
        word: z
            .string()
            .trim()
            .min(1, "Phải nhập từ cần cập nhật")
            .max(255, "Từ vựng không được vượt quá 255 ký tự")
            .optional(),
        meaning: z
            .string()
            .trim()
            .min(1, "Phải nhập nghĩa của từ")
            .optional(),
        pronunciation: nullableTextSchema,
        audioUrl: nullableTextSchema,
        audioUsUrl: nullableTextSchema,
        audioUkUrl: nullableTextSchema,
        example: nullableTextSchema,
        exampleVi: nullableTextSchema,
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        { message: "Cần cung cấp ít nhất một trường để cập nhật" }
    ),
});
