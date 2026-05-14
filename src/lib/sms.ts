import axios from "axios";

import { normalizeBdPhone } from "@/lib/phone";

export type SmsSendResult =
  | { ok: true; mode: string; detail?: unknown }
  | { ok: false; mode: string; error: string; detail?: unknown };

/**
 * Builds the Dokandar OTP SMS body. Swap template when wiring i18n / branding.
 */
export function formatOtpSmsMessage(code: string): string {
  return `Dokandar.app: আপনার OTP হলো ${code}। কোডটি ৫ মিনিটের মধ্যে ব্যবহার করুন।`;
}

function sendSmsUrl(): string {
  const base =
    process.env.SSL_WIRELESS_BASE_URL?.replace(/\/$/, "") ??
    "https://smsplus.sslwireless.com";
  if (base.includes("/api/")) {
    return base;
  }
  return `${base}/api/v3/send-sms`;
}

/**
 * SSL Wireless — ISMS+ JSON API (v3). Requires:
 * - `SSL_WIRELESS_API_KEY` (api_token from SSL panel)
 * - `SSL_WIRELESS_SENDER_ID` (SID / stakeholder / non-masking sender id)
 * - `SSL_WIRELESS_BASE_URL` (optional, default `https://smsplus.sslwireless.com`)
 */
async function sendViaIsmsPlusJson(args: {
  msisdn: string;
  message: string;
  csmsId: string;
}): Promise<SmsSendResult> {
  const apiToken = process.env.SSL_WIRELESS_API_KEY?.trim();
  const sid = process.env.SSL_WIRELESS_SENDER_ID?.trim();
  if (!apiToken || !sid) {
    return {
      ok: false,
      mode: "ismsplus",
      error:
        "SSL_WIRELESS_API_KEY বা SSL_WIRELESS_SENDER_ID সেট করা নেই। এসএমএস পাঠানো হয়নি।",
    };
  }

  const url = sendSmsUrl();
  try {
    const { data, status } = await axios.post(
      url,
      {
        api_token: apiToken,
        sid,
        sms: [
          {
            msisdn: args.msisdn,
            message: args.message,
            csms_id: args.csmsId,
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (status >= 200 && status < 300) {
      const body = data as Record<string, unknown>;
      const code =
        typeof body.status_code === "number"
          ? body.status_code
          : typeof body.status === "string" && body.status === "SUCCESS"
            ? 200
            : undefined;
      if (code === 200 || body.status === "SUCCESS" || body.status === "success") {
        return { ok: true, mode: "ismsplus", detail: data };
      }
      const errMsg =
        (typeof body.error_message === "string" && body.error_message) ||
        (typeof body.message === "string" && body.message) ||
        `অপ্রত্যাশিত উত্তর (HTTP ${status})`;
      return { ok: false, mode: "ismsplus", error: errMsg, detail: data };
    }

    return {
      ok: false,
      mode: "ismsplus",
      error: `HTTP ${status}`,
      detail: data,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "অজানা ত্রুটি";
    return { ok: false, mode: "ismsplus", error: msg, detail: e };
  }
}

/**
 * Legacy push API (form POST). Env: `SSL_WIRELESS_LEGACY_USER`, `SSL_WIRELESS_LEGACY_PASS`,
 * `SSL_WIRELESS_SENDER_ID` as `sid`, optional `SSL_WIRELESS_LEGACY_URL`.
 */
async function sendViaLegacyPush(args: {
  msisdn: string;
  message: string;
  csmsId: string;
}): Promise<SmsSendResult> {
  const user = process.env.SSL_WIRELESS_LEGACY_USER?.trim();
  const pass = process.env.SSL_WIRELESS_LEGACY_PASS?.trim();
  const sid = process.env.SSL_WIRELESS_SENDER_ID?.trim();
  if (!user || !pass || !sid) {
    return {
      ok: false,
      mode: "legacy",
      error:
        "লিগ্যাসি মোডের জন্য SSL_WIRELESS_LEGACY_USER, SSL_WIRELESS_LEGACY_PASS এবং SSL_WIRELESS_SENDER_ID লাগবে।",
    };
  }

  const url =
    process.env.SSL_WIRELESS_LEGACY_URL?.trim() ??
    "https://sms.sslwireless.com/pushapi/dynamic/server.php";

  const body = new URLSearchParams({
    user,
    pass,
    sid,
    "sms[0][0]": args.msisdn,
    "sms[0][1]": args.message,
    "sms[0][2]": args.csmsId,
  });

  try {
    const { data, status } = await axios.post(url, body.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 20_000,
      validateStatus: () => true,
    });

    if (status >= 200 && status < 300) {
      const text = typeof data === "string" ? data : String(data);
      if (/REFERENCEID/i.test(text) || /success/i.test(text)) {
        return { ok: true, mode: "legacy", detail: text.slice(0, 500) };
      }
      return {
        ok: false,
        mode: "legacy",
        error: "গেটওয়ে ব্যর্থ উত্তর",
        detail: text.slice(0, 500),
      };
    }
    return {
      ok: false,
      mode: "legacy",
      error: `HTTP ${status}`,
      detail: data,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "অজানা ত্রুটি";
    return { ok: false, mode: "legacy", error: msg, detail: e };
  }
}

/**
 * Entry point for transactional SMS. Uses `SSL_WIRELESS_MODE`:
 * - `legacy` — classic push API
 * - default / `ismsplus` — JSON v3
 *
 * When `SMS_DISABLE_SEND=true`, skips the HTTP call (OTP still works via in-memory / mock).
 */
export async function sendSslWirelessSms(args: {
  toPhone: string;
  message: string;
  /** Idempotency / trace id per message */
  csmsId: string;
}): Promise<SmsSendResult> {
  const msisdn = normalizeBdPhone(args.toPhone);
  if (!msisdn) {
    return { ok: false, mode: "none", error: "সঠিক বাংলাদেশি মোবাইল নয়" };
  }

  if (process.env.SMS_DISABLE_SEND === "true") {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info(
        "[sms] SMS_DISABLE_SEND=true — would send to",
        msisdn,
        args.message.slice(0, 40) + "…",
      );
    }
    return { ok: true, mode: "disabled", detail: "SMS_DISABLE_SEND" };
  }

  const mode = (process.env.SSL_WIRELESS_MODE ?? "ismsplus").toLowerCase();
  if (mode === "legacy") {
    return sendViaLegacyPush({
      msisdn,
      message: args.message,
      csmsId: args.csmsId,
    });
  }
  return sendViaIsmsPlusJson({
    msisdn,
    message: args.message,
    csmsId: args.csmsId,
  });
}

/**
 * OTP SMS — generates `csmsId` and delegates to {@link sendSslWirelessSms}.
 * Call from `/api/auth/request-otp` (or future queue worker).
 */
export async function sendOtpSms(toPhone: string, code: string): Promise<SmsSendResult> {
  const message = formatOtpSmsMessage(code);
  const csmsId = `otp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return sendSslWirelessSms({ toPhone, message, csmsId });
}
