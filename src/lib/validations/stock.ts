import { z } from "zod";

const moneyStr = z
  .string()
  .trim()
  .min(1, "দাম লিখুন")
  .refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "সঠিক সংখ্যা দিন");

const moneyStrOrZero = z
  .string()
  .trim()
  .transform((s) => (s === "" ? "0" : s))
  .refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "সঠিক সংখ্যা দিন");

export const newProductSchema = z.object({
  name: z.string().trim().min(1, "পণ্যের নাম দিন").max(160),
  category: z.string().trim().max(120).default(""),
  sku: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((s) => (s === "" ? undefined : s)),
  buyPriceTaka: moneyStrOrZero,
  sellPriceTaka: moneyStr,
  lowStockAlert: z.coerce
    .number()
    .int()
    .min(0, "সতর্কতা ০ বা বেশি হবে")
    .max(1_000_000, "অতিরিক্ত বড় সংখ্যা"),
  initialQty: z.coerce.number().int().min(0, "০ বা বেশি").max(1_000_000),
});

export const adjustStockSchema = z.object({
  direction: z.enum(["add", "remove"]),
  quantity: z.coerce.number().int().min(1, "পরিমাণ কমপক্ষে ১"),
  note: z.string().trim().max(500).optional(),
});

export type NewProductInput = z.infer<typeof newProductSchema>;
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
