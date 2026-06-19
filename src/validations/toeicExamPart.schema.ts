import { z } from "zod";

const examSetParamsSchema = z.object({
    examSetId: z.coerce.number().int().positive("examSetId phải là số nguyên dương"),
}).strict();

const partParamsSchema = z.object({
    id: z.coerce.number().int().positive("id phải là số nguyên dương"),
}).strict();

export const getToeicExamPartsByExamSetSchema = z.object({
    params: examSetParamsSchema,
});

export const createToeicExamPartSchema = z.object({
    body: z.object({
        partNumber: z.number().int().min(1, "partNumber phải nằm trong khoảng từ 1 đến 7").max(7, "partNumber phải nằm trong khoảng từ 1 đến 7"),
        questionCount: z.number().int().positive("questionCount phải là số nguyên dương"),
        durationSeconds: z.number().int().nonnegative("durationSeconds phải là số nguyên không âm").nullable().optional(),
    }).strict(),
    params: examSetParamsSchema,
});

export const getToeicExamPartByIdSchema = z.object({
    params: partParamsSchema,
});

export const updateToeicExamPartSchema = z.object({
    body: z.object({
        questionCount: z.number().int().positive("questionCount phải là số nguyên dương").optional(),
        durationSeconds: z.number().int().nonnegative("durationSeconds phải là số nguyên không âm").nullable().optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "Cần cung cấp ít nhất một trường để cập nhật",
        }
    ),
    params: partParamsSchema,
});

export const deleteToeicExamPartSchema = z.object({
    params: partParamsSchema,
});
