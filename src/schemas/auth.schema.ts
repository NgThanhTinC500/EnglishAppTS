import { z } from "zod";

export const signupSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(6, "Name must be at least 6 characters")
            .max(50, "Name must be at most 50 characters"),

        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Email is not valid"),

        password: z
            .string()
            .min(8, "Password must be at least 8 characters"),

        passwordConfirm: z.string(),
    }).strict().refine(
        (data) => data.password === data.passwordConfirm,
        {
            path: ["passwordConfirm"],
            message: "Passwords do not match",
        }
    ),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .email("Email is not valid"),

        password: z
            .string()
            .min(1, "Password is required"),
    }).strict(),
});