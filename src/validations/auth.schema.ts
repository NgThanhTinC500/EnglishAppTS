import { z } from "zod";

export const signupSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(6, "Tên phải có ít nhất 6 ký tự")
            .max(50, "Tên không được vượt quá 50 ký tự"),

        email: z
            .string()
            .trim()
            .toLowerCase()
            .min(1, "Email là bắt buộc")
            .email("Email không hợp lệ"),

        password: z
            .string()
            .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),

        passwordConfirm: z.string(),
    }).strict().refine(
        (data) => data.password === data.passwordConfirm,
        {
            path: ["passwordConfirm"],
            message: "Mật khẩu xác nhận không khớp",
        }
    ),
});

export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .min(1, "Email là bắt buộc")
            .email("Email không hợp lệ"),

        password: z
            .string()
            .min(1, "Mật khẩu là bắt buộc"),
    }).strict(),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z
            .string()
            .trim()
            .toLowerCase()
            .min(1, "Email là bắt buộc")
            .email("Email không hợp lệ"),
    }).strict(),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        password: z
            .string()
            .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
        passwordConfirm: z.string(),
    }).strict().refine(
        (data) => data.password === data.passwordConfirm,
        {
            path: ["passwordConfirm"],
            message: "Mật khẩu xác nhận không khớp",
        }
    ),
});

export const updatePasswordSchema = z.object({
    body: z.object({
        currentPassword: z
            .string()
            .min(1, "Mật khẩu hiện tại là bắt buộc"),
        newPassword: z
            .string()
            .min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
        passwordConfirm: z.string(),
    }).strict().refine(
        (data) => data.newPassword === data.passwordConfirm,
        {
            path: ["passwordConfirm"],
            message: "Mật khẩu xác nhận không khớp",
        }
    ),
});
