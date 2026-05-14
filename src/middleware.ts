import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/auth" },
  callbacks: {
    /** Require a full shop-bound session (matches dashboard layout checks). */
    authorized: ({ token }) =>
      Boolean(token?.sub && (token as { shopId?: string }).shopId),
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
