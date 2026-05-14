import { z } from "zod";

const phoneField = z
  .string()
  .trim()
  .min(10, "মোবাইল নম্বর দিন")
  .max(20, "নম্বর অতিরিক্ত লম্বা");

const otpField = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "৬ সংখ্যার OTP দিন");

export const otpLoginSchema = z.object({
  phone: phoneField,
  otp: otpField,
});

const passwordField = z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর");

export const passwordLoginSchema = z.object({
  phone: phoneField,
  password: passwordField,
});

export const signupPhoneSchema = z.object({
  shopName: z.string().trim().min(2, "দোকানের নাম কমপক্ষে ২ অক্ষর"),
  name: z.string().trim().min(2, "আপনার নাম কমপক্ষে ২ অক্ষর"),
  phone: phoneField,
  otp: otpField,
});

export const requestOtpBodySchema = z.object({
  phone: z.string().min(8, "মোবাইল দিন"),
  intent: z.enum(["login", "signup"]),
});

export type OtpLoginInput = z.infer<typeof otpLoginSchema>;
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;
export type SignupPhoneInput = z.infer<typeof signupPhoneSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpBodySchema>;
