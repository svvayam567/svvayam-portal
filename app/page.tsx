"use client";

import { useEffect } from "react";
import supabase from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      router.replace("/login");
      return;
    }

    if (data.role === "admin") {
      router.replace("/admin");
      return;
    }

    if (data.role === "client") {
      router.replace("/client");
      return;
    }

    router.replace("/login");
  }

  return (
    <main style={{ padding: "40px" }}>
      <h2>Loading...</h2>
    </main>
  );
}