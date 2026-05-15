export const QUEUE_NAME = "dokandar.jobs";

export type QueueJob =
  | {
      type: "sms.otp";
      payload: { phone: string; code: string; csmsId: string };
    }
  | {
      type: "sms.raw";
      payload: { phone: string; message: string; csmsId: string };
    }
  | {
      type: "cache.invalidate";
      payload: { shopId: string; scope: "stock" | "baki" | "sales" | "all"; date?: string };
    };
