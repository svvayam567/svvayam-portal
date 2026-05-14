"use client";

import { useEffect, useState } from "react";
import supabase from "../../../lib/supabase";
import { useRouter } from "next/navigation";

type Checklist = {
  id: number;
  title: string;
  stage: string;
};

export default function MasterChecklistPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [items, setItems] = useState<
    Checklist[]
  >([]);

  const [title, setTitle] =
    useState("");

  const [stage, setStage] =
    useState("Design");

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

    await fetchChecklist();

    setLoading(false);
  }

  async function fetchChecklist() {
    const { data, error } =
      await supabase
        .from("checklist")
        .select("*")
        .order("id", {
          ascending: true,
        });

    if (error) {
      console.log(error);
      return;
    }

    setItems(data || []);
  }

  async function addChecklist() {
    if (!title.trim()) return;

    const { error } = await supabase
      .from("checklist")
      .insert({
        title,
        stage,
      });

    if (error) {
      console.log(error);
      return;
    }

    setTitle("");

    fetchChecklist();
  }

  async function deleteChecklist(
    id: number
  ) {
    const confirmed = confirm(
      "Delete checklist item?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("checklist")
      .delete()
      .eq("id", id);

    if (error) {
      console.log(error);
      return;
    }

    fetchChecklist();
  }

  const grouped = {
    Design: items.filter(
      (i) => i.stage === "Design"
    ),

    Production: items.filter(
      (i) =>
        i.stage === "Production"
    ),

    Dispatch: items.filter(
      (i) => i.stage === "Dispatch"
    ),
  };

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
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <div>
          <p
            style={{
              color: "#9ca3af",
              textTransform:
                "uppercase",
              letterSpacing: "1px",
              fontSize: "13px",
              marginBottom: "10px",
            }}
          >
            Global Workflow Control
          </p>

          <h1
            style={{
              fontSize: "42px",
              fontFamily: "serif",
            }}
          >
            Master Checklist
          </h1>
        </div>

        <button
          onClick={() =>
            router.push("/admin")
          }
          style={{
            padding: "12px 18px",
            background: "white",
            border:
              "1px solid #d1d5db",
            cursor: "pointer",
          }}
        >
          Back Dashboard
        </button>
      </div>

      {/* ADD ITEM */}

      <section
        style={{
          background: "white",
          padding: "30px",
          marginBottom: "30px",
          border:
            "1px solid #ece7df",
        }}
      >
        <h2
          style={{
            marginBottom: "20px",
            fontFamily: "serif",
          }}
        >
          Add Checklist Step
        </h2>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Checklist title"
            style={{
              flex: 1,
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          />

          <select
            value={stage}
            onChange={(e) =>
              setStage(e.target.value)
            }
            style={{
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          >
            <option>
              Design
            </option>

            <option>
              Production
            </option>

            <option>
              Dispatch
            </option>
          </select>

          <button
            onClick={addChecklist}
            style={{
              padding: "14px 20px",
              background: "#111827",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </section>

      {/* CHECKLIST GROUPS */}

      {Object.entries(grouped).map(
        ([stage, stageItems]) => (
          <section
            key={stage}
            style={{
              background: "white",
              padding: "30px",
              marginBottom: "30px",
              border:
                "1px solid #ece7df",
            }}
          >
            <h2
              style={{
                marginBottom: "24px",
                fontFamily: "serif",
              }}
            >
              {stage}
            </h2>

            <div
              style={{
                display: "grid",
                gap: "12px",
              }}
            >
              {stageItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    padding: "18px",
                    border:
                      "1px solid #f3f4f6",
                    background:
                      "#fafaf9",
                  }}
                >
                  <p>{item.title}</p>

                  <button
                    onClick={() =>
                      deleteChecklist(
                        item.id
                      )
                    }
                    style={{
                      padding:
                        "10px 14px",
                      border:
                        "1px solid #dc2626",
                      background:
                        "white",
                      color:
                        "#dc2626",
                      cursor:
                        "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>
        )
      )}
    </main>
  );
}