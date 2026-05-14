"use client";

import { useState } from "react";
import supabase from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [msg, setMsg] =
    useState("");

  async function handleLogin() {
    setMsg("");

    const { error } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/admin");
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
          width: "400px",
          background: "white",
          padding: "40px",
          border:
            "1px solid #ece7df",
        }}
      >
        <p
          style={{
            color: "#9ca3af",
            marginBottom: "10px",
            textTransform:
              "uppercase",
            letterSpacing: "1px",
            fontSize: "13px",
          }}
        >
          Manufacturing Execution
          System
        </p>

        <h1
          style={{
            fontSize: "38px",
            fontFamily: "serif",
            marginBottom: "30px",
          }}
        >
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "14px",
            border:
              "1px solid #d1d5db",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "20px",
            border:
              "1px solid #d1d5db",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: "100%",
            padding: "14px",
            background: "#111827",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Login
        </button>

        {msg && (
          <p
            style={{
              marginTop: "20px",
              color: "red",
            }}
          >
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}