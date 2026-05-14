import { z } from "zod";

const money = z
  .string()
  .trim()
  .min(1, "টাকা লিখুন")
  .refine((v) => /^\d+(\.\d{1,4})?$/.test(v), "সঠিক সংখ্যা");

export const checkoutSchema = z.object({
  customerId: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : v),
    z.string().uuid().optional(),
  ),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid("সঠিক পণ্য আইডি"),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, "কমপক্ষে একটি লাইন"),
  cashPaidTaka: money,
  creditAmountTaka: z.preprocess(
    (v) => (v === undefined || v === null || v === "" ? "0" : String(v)),
    z.string().refine((x) => /^\d+(\.\d{1,4})?$/.test(x), "সঠিক সংখ্যা"),
  ),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
