"use server";

import { auth } from "@/auth";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function addUser(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    const name     = formData.get("name") as string;
    const email    = formData.get("email") as string;
    const role     = formData.get("role") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !role || !password) {
      return { success: false, error: "Missing required fields" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await sql`
        INSERT INTO users (name, email, role, password, status)
        VALUES (${name}, ${email}, ${role}, ${hashedPassword}, 'Active')
      `;
    } catch (err: any) {
      // PostgreSQL unique violation code
      if (err?.code === "23505") {
        return { success: false, error: "User with this email already exists" };
      }
      return { success: false, error: "An unexpected error occurred. Please try again." };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.id === userId) {
      return { success: false, error: "Cannot delete yourself" };
    }

    await sql`DELETE FROM users WHERE id = ${userId}::uuid`;

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    const name   = formData.get("name") as string;
    const role   = formData.get("role") as string;
    const status = formData.get("status") as string;

    if (!name || !role || !status) {
      return { success: false, error: "Missing required fields" };
    }

    await sql`
      UPDATE users
      SET name = ${name}, role = ${role}, status = ${status}
      WHERE id = ${userId}::uuid
    `;

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function resetPassword(userId: string, formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    const password = formData.get("password") as string;

    if (!password) {
      return { success: false, error: "Password is required" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      UPDATE users SET password = ${hashedPassword} WHERE id = ${userId}::uuid
    `;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
