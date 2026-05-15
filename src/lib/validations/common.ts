import { isValid, parseISO } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";

/** Route / query params: UUID v4 */
export const uuidParamSchema = z.string().uuid("সঠিক আইডি নয়");

/** Optional `?date=YYYY-MM-DD` for reports / summaries */
export const reportDateQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "তারিখ YYYY-MM-DD ফরম্যাটে দিন")
    .optional()
    .refine((d) => d === undefined || isValid(parseISO(d)), "সঠিক তারিখ নয়"),
});

export function zodFirstError(error: z.ZodError): string {
  return error.errors[0]?.message ?? "তথ্য যাচাই ব্যর্থ";
}

export function invalidUuidResponse(): NextResponse {
  return NextResponse.json({ error: "সঠিক আইডি নয়" }, { status: 400 });
}

const MAX_PAGE_LIMIT = 200;

/** `?limit=` and `?cursor=` for paginated list endpoints */
export const paginationQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_LIMIT)
    .optional()
    .default(50),
  cursor: z.string().uuid("সঠিক কার্সর নয়").optional(),
});

export const MAX_LIST_LIMIT = MAX_PAGE_LIMIT;
