"use client";

import { useState } from "react";
import supabase from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ClientLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("");

  async function handleLogin() {
    setMsg("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setMsg(error.message);
      return;
    }

    if (!data.user) {
      setMsg("Login failed");
      return;
    }

    // CHECK IF USER EXISTS
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    // CREATE CLIENT USER IF MISSING
    if (!existing) {
      await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        role: "client",
      });
    }

    // REDIRECT
    router.replace("/client");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f8f6f2",
      }}
    >
      <div
        style={{
          width: "360px",
          background: "white",
          padding: "40px",
          border: "1px solid #e5e7eb",
        }}
      >
        <h1 style={{ marginBottom: "30px" }}>
          Client Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "14px",
            border: "1px solid #d1d5db",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "20px",
            border: "1px solid #d1d5db",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "12px",
            background: "#111827",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        <p
          style={{
            marginTop: "16px",
            color: "red",
          }}
        >
          {msg}
        </p>
      </div>
    </main>
  );
}