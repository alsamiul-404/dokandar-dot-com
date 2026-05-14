import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      shopId: string;
      shopName: string;
      phone?: string;
    };
  }

  interface User {
    shopId?: string;
    shopName?: string;
    phone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    shopId?: string;
    shopName?: string;
    phone?: string;
  }
}
