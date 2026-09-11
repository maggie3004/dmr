import NextAuth, { CredentialsSignin } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

class InactiveUserError extends CredentialsSignin {
  code = "inactive_account";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const parsedCredentials = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

          if (parsedCredentials.success) {
            const email = parsedCredentials.data.email.trim().toLowerCase();
            const password = parsedCredentials.data.password;

            const rows = await sql`
              SELECT * FROM users WHERE LOWER(email) = ${email} LIMIT 1
            `;
            const user = rows[0];

            if (!user) {
              console.log("[AUTH] User not found for email:", email);
              return null;
            }

            if (user.status !== "Active") {
              console.log("[AUTH] User is inactive:", email);
              throw new InactiveUserError();
            }

            const passwordsMatch = await bcrypt.compare(password, user.password);

            if (passwordsMatch) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            } else {
              console.log("[AUTH] Password mismatch for user:", email);
            }
          } else {
            console.log("[AUTH] Credential validation failed:", parsedCredentials.error);
          }
        } catch (err) {
          console.error("[AUTH AUTHORIZE ERROR]:", err);
          if (err instanceof CredentialsSignin) throw err;
        }

        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as any;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
})
