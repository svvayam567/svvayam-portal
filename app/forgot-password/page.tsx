"use client";

import { useState } from "react";

import supabase from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function resetPassword() {
    if (!email) {
      alert("Enter email");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            "https://YOUR-PROJECT.vercel.app/reset-password",
        }
      );

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessage(
      "Password reset email sent."
    );
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
          Forgot Password
        </h1>

        <p
          style={{
            marginBottom: "24px",
            color: "#6b7280",
          }}
        >
          Enter your email to receive
          password reset link.
        </p>

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
            border:
              "1px solid #d1d5db",
            marginBottom: "20px",
          }}
        />

        <button
          onClick={resetPassword}
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
            ? "Sending..."
            : "Send Reset Link"}
        </button>

        {message && (
          <p
            style={{
              marginTop: "20px",
              color: "green",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}