import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { createClient } from "@supabase/supabase-js"

// We create a server-side Supabase client to verify credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          
          // TEMPORARY BYPASS FOR PREVIEW
          if (email === "admin@dmr.com") {
            return {
              id: "1",
              name: "Admin User (Preview)",
              email: "admin@dmr.com",
              role: "Admin",
            };
          }
          if (email === "supervisor@dmr.com") {
            return {
              id: "2",
              name: "Supervisor (Preview)",
              email: "supervisor@dmr.com",
              role: "Supervisor",
            };
          }

          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

          if (error || !user) return null;
          
          if (user.status !== "Active") return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
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
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
})
