import NextAuth, { type DefaultSession } from "next-auth"

export type UserRole = "Admin" | "Supervisor"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}
