import { NextResponse } from "next/server";

type JsonInit = ResponseInit & {
  /** Default true for authenticated / financial API responses */
  noStore?: boolean;
};

/**
 * JSON response with cache headers safe for money / auth data.
 */
export function jsonResponse(body: unknown, init?: JsonInit): NextResponse {
  const { noStore = true, headers, ...rest } = init ?? {};
  const h = new Headers(headers);
  if (noStore) {
    h.set("Cache-Control", "no-store, no-cache, must-revalidate");
    h.set("Pragma", "no-cache");
  }
  return NextResponse.json(body, { ...rest, headers: h });
}
