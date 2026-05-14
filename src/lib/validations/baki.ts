import { z } from "zod";

const money = z
  .string()
  .trim()
  .min(1, "টাকার পরিমাণ দিন")
  .refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "সঠিক সংখ্যা দিন (যেমন ১০০ বা ৫০.৫০)");

export const newCustomerSchema = z.object({
  name: z.string().trim().min(1, "নাম দিন").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
});

export const addBakiSchema = z.object({
  amountTaka: money,
  note: z.string().trim().max(500).optional(),
});

export const takePaymentSchema = z.object({
  amountTaka: money,
  note: z.string().trim().max(500).optional(),
});

/** POST `/api/baki/customers/:id/entries` */
export const bakiEntryPostSchema = z.object({
  kind: z.enum(["ADD_BAKI", "PAYMENT"]),
  amountTaka: z
    .string()
    .trim()
    .min(1, "টাকার পরিমাণ দিন")
    .refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "সঠিক সংখ্যা দিন"),
  note: z.string().trim().max(500).optional(),
});

/** POST `/api/baki/customers/:id/sms` — reserved for future payload */
export const bakiSmsPostSchema = z.object({}).strict();
