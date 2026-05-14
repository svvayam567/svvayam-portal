"use client";

import { useEffect, useState } from "react";
import supabase from "../../../lib/supabase";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
};

type Checklist = {
  id: number;
};

export default function CreateProjectPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [clientName, setClientName] =
    useState("");

  const [selectedClient, setSelectedClient] =
    useState("");

  const [clients, setClients] =
    useState<User[]>([]);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: roleData } =
      await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (roleData?.role !== "admin") {
      router.replace("/client");
      return;
    }

    await fetchClients();

    setLoading(false);
  }

  async function fetchClients() {
    const { data, error } =
      await supabase
        .from("users")
        .select("*")
        .eq("role", "client");

    if (error) {
      console.log(error);
      return;
    }

    setClients(data || []);
  }

  async function createProject() {
    if (
      !clientName ||
      !selectedClient
    ) {
      alert("Fill all fields");
      return;
    }

    const selected =
      clients.find(
        (c) =>
          c.id === selectedClient
      );

    if (!selected) {
      alert("Client not found");
      return;
    }

    /* CREATE PROJECT */

    const { data: project, error } =
      await supabase
        .from("projects")
        .insert({
          client_name: clientName,
          client_email:
            selected.email,
          client_id: selected.id,
          current_stage:
            "Design",
          status: "active",
        })
        .select()
        .single();

    if (error || !project) {
      console.log(error);
      return;
    }

    /* FETCH MASTER CHECKLIST */

    const {
      data: checklistItems,
    } = await supabase
      .from("checklist")
      .select("id");

    if (!checklistItems) {
      return;
    }

    /* CREATE PROJECT CHECKLIST */

    const rows =
      checklistItems.map(
        (item: Checklist) => ({
          project_id: project.id,
          checklist_id: item.id,
          status: "pending",
        })
      );

    const { error: checklistError } =
      await supabase
        .from("project_checklist")
        .insert(rows);

    if (checklistError) {
      console.log(
        checklistError
      );
      return;
    }

    alert(
      "Project created successfully"
    );

    router.push("/admin");
  }

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        Loading...
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8f6f2",
        padding: "50px",
        color: "#111827",
        fontFamily:
          "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
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
        </p>

        <h1
          style={{
            fontSize: "42px",
            fontFamily: "serif",
            marginBottom: "40px",
          }}
        >
          Create Project
        </h1>

        {/* CLIENT NAME */}

        <div
          style={{
            marginBottom: "20px",
          }}
        >
          <p
            style={{
              marginBottom: "10px",
            }}
          >
            Project Name
          </p>

          <input
            value={clientName}
            onChange={(e) =>
              setClientName(
                e.target.value
              )
            }
            placeholder="Temple Project"
            style={{
              width: "100%",
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          />
        </div>

        {/* CLIENT SELECT */}

        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <p
            style={{
              marginBottom: "10px",
            }}
          >
            Assign Client
          </p>

          <select
            value={selectedClient}
            onChange={(e) =>
              setSelectedClient(
                e.target.value
              )
            }
            style={{
              width: "100%",
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          >
            <option value="">
              Select Client
            </option>

            {clients.map((client) => (
              <option
                key={client.id}
                value={client.id}
              >
                {client.email}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIONS */}

        <div
          style={{
            display: "flex",
            gap: "14px",
          }}
        >
          <button
            onClick={createProject}
            style={{
              padding: "14px 20px",
              background: "#111827",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Create Project
          </button>

          <button
            onClick={() =>
              router.push("/admin")
            }
            style={{
              padding: "14px 20px",
              background: "white",
              border:
                "1px solid #d1d5db",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}