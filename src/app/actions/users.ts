"use server";

import { auth } from "@/auth";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function addUser(formData: FormData) {
  try {
    const session = await auth();
    if (session?.user?.role !== "Admin") {
      return { success: false, error: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !role || !password) {
      return { success: false, error: "Missing required fields" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase.from("users").insert({
      name,
      email,
      role,
      password: hashedPassword,
      status: "Active"
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "User with this email already exists" };
      }
      console.error("Users Action Error:", error);
      return { success: false, error: "An unexpected error occurred. Please try again." };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Users Action Error:", error);
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

    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    console.error("Users Action Error:", error);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}
