import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getPrisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyOtp } from "@/lib/otp";
import { normalizeBdPhone } from "@/lib/phone";
import { otpLoginSchema, passwordLoginSchema } from "@/lib/validations/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "মোবাইল", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(raw) {
        const parsed = otpLoginSchema.safeParse({
          phone: raw?.phone,
          otp: raw?.otp,
        });
        if (!parsed.success) {
          return null;
        }

        const phone = normalizeBdPhone(parsed.data.phone);
        if (!phone) {
          return null;
        }

        if (!verifyOtp(phone, parsed.data.otp, { consume: true })) {
          return null;
        }

        const user = await getPrisma().user.findUnique({
          where: { phone },
          include: { shop: true },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: `${user.phone}@phone.dokandar.local`,
          name: user.name,
          phone: user.phone,
          shopId: user.shopId,
          shopName: user.shop.name,
        };
      },
    }),
    CredentialsProvider({
      id: "phone-password",
      name: "Phone + Password",
      credentials: {
        phone: { label: "মোবাইল", type: "text" },
        password: { label: "পাসওয়ার্ড", type: "password" },
      },
      async authorize(raw) {
        const parsed = passwordLoginSchema.safeParse({
          phone: raw?.phone,
          password: raw?.password,
        });
        if (!parsed.success) {
          return null;
        }

        const phone = normalizeBdPhone(parsed.data.phone);
        if (!phone) {
          return null;
        }

        const user = await getPrisma().user.findUnique({
          where: { phone },
          include: { shop: true },
        });

        if (!user) {
          return null;
        }

        const ok = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!ok) {
          return null;
        }

        return {
          id: user.id,
          email: `${user.phone}@phone.dokandar.local`,
          name: user.name,
          phone: user.phone,
          shopId: user.shopId,
          shopName: user.shop.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.shopId = user.shopId;
        token.shopName = user.shopName;
        token.phone = (user as { phone?: string }).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        session.user.shopId = token.shopId as string;
        session.user.shopName = token.shopName as string;
        session.user.phone = token.phone as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
