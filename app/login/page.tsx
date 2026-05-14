"use client";

import { useRouter } from "next/navigation";

export default function LoginChoice() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
        color: "white",
      }}
    >
      <div
        style={{
          background: "#1e293b",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          width: "320px",
        }}
      >
        <h2>Welcome</h2>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          Choose how you want to continue
        </p>

        <button
          onClick={() => router.push("/client-login")}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "20px",
            background: "#22c55e",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Client Login
        </button>

        <button
          onClick={() => router.push("/admin/login")}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "10px",
            background: "#3b82f6",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            color: "white",
          }}
        >
          Admin Login
        </button>
        <p
  style={{
    marginTop: "16px",
    textAlign: "center",
  }}
>
  <a
    href="/forgot-password"
    style={{
      color: "#111827",
      textDecoration:
        "underline",
    }}
  >
    Forgot Password?
  </a>
</p>
      </div>
    </main>
  );
}