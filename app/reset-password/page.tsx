"use client";

import { useState } from "react";

import supabase from "../../lib/supabase";

import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function updatePassword() {
    if (!password) {
      alert(
        "Enter new password"
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser(
        {
          password,
        }
      );

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Password updated successfully"
    );

    router.replace("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f6f2",
        padding: "30px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "40px",
          border:
            "1px solid #ece7df",
        }}
      >
        <h1
          style={{
            fontSize: "34px",
            marginBottom: "14px",
            fontFamily: "serif",
          }}
        >
          Reset Password
        </h1>

        <p
          style={{
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Enter your new password.
        </p>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: "14px",
            border:
              "1px solid #d1d5db",
            marginBottom: "20px",
          }}
        />

        <button
          onClick={updatePassword}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            background: "#111827",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Updating..."
            : "Update Password"}
        </button>
      </div>
    </main>
  );
}