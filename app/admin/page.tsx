"use client";

import { useEffect, useState } from "react";
import supabase from "../../lib/supabase";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  client_name: string;
  client_email: string;
  current_stage: string;
  status: string;
  progress: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [clientName, setClientName] =
    useState("");

  const [clientEmail, setClientEmail] =
    useState("");

  const [currentStage, setCurrentStage] =
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

    await fetchProjects();

    setupRealtime();

    setLoading(false);
  }

  async function fetchProjects() {
    const { data, error } =
  await supabase
    .from("projects")
    .select("*")
    .order("client_name", {
      ascending: true,
    });

    if (error) {
      alert(JSON.stringify(error));
      return;
    }

    setProjects(data || []);
  }

  function setupRealtime() {
  const existingChannels =
    supabase.getChannels();

  existingChannels.forEach(
    (channel) => {
      if (
        channel.topic ===
        "realtime:admin-projects-realtime"
      ) {
        supabase.removeChannel(
          channel
        );
      }
    }
  );

  const channel =
    supabase.channel(
      "admin-projects-realtime"
    );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "projects",
    },
    async () => {
      await fetchProjects();
    }
  );

  channel.subscribe();
}

 async function createProject() {
  if (
    !clientName ||
    !clientEmail
  ) {
    alert(
      "Enter client details"
    );
    return;
  }

  try {
    const response =
      await fetch(
        "/api/create-client",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            clientName,
            clientEmail,
            currentStage,
          }),
        }
      );

    const result =
      await response.json();

    if (!response.ok) {
      alert(
        result.error ||
          "Something went wrong"
      );

      return;
    }

    alert(
      "Project Created Successfully"
    );

    setClientName("");
    setClientEmail("");
    setCurrentStage("Design");

    await fetchProjects();
  } catch (error) {
    alert(
      "Server Error"
    );

    console.log(error);
  }
}

  async function deleteProject(
    projectId: string
  ) {
    const confirmDelete =
      confirm(
        "Delete this project?"
      );

    if (!confirmDelete) return;

    const {
      error: checklistDeleteError,
    } = await supabase
      .from("project_checklist")
      .delete()
      .eq("project_id", projectId);

    if (checklistDeleteError) {
      alert(
        JSON.stringify(
          checklistDeleteError
        )
      );
      return;
    }

    const {
      error: commentsDeleteError,
    } = await supabase
      .from("comments")
      .delete()
      .eq("project_id", projectId);

    if (commentsDeleteError) {
      alert(
        JSON.stringify(
          commentsDeleteError
        )
      );
      return;
    }

    const {
      error: projectDeleteError,
    } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (projectDeleteError) {
      alert(
        JSON.stringify(
          projectDeleteError
        )
      );
      return;
    }

    await fetchProjects();

    alert(
      "Project deleted successfully"
    );
  }

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/login");
  }

  if (loading) {
    return (
      <main
        style={{
          padding: 40,
        }}
      >
        Loading Dashboard...
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
          marginBottom: "50px",
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
            Manufacturing Execution
            System
          </p>

          <h1
            style={{
              fontSize: "42px",
              fontFamily: "serif",
              fontWeight: 500,
            }}
          >
            Admin Dashboard
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
          }}
        >
          <button
            onClick={() =>
              router.push(
                "/admin/checklist"
              )
            }
            style={{
              padding: "12px 18px",
              border:
                "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
            }}
          >
            Master Checklist
          </button>

          <button
            onClick={logout}
            style={{
              padding: "12px 18px",
              background: "#111827",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* OVERVIEW */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "30px",
            border:
              "1px solid #ece7df",
          }}
        >
          <p
            style={{
              color: "#9ca3af",
              marginBottom: "10px",
            }}
          >
            Total Projects
          </p>

          <h2
            style={{
              fontSize: "34px",
              fontFamily: "serif",
            }}
          >
            {projects.length}
          </h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "30px",
            border:
              "1px solid #ece7df",
          }}
        >
          <p
            style={{
              color: "#9ca3af",
              marginBottom: "10px",
            }}
          >
            In Production
          </p>

          <h2
            style={{
              fontSize: "34px",
              fontFamily: "serif",
            }}
          >
            {
              projects.filter(
                (p) =>
                  p.current_stage ===
                  "Production"
              ).length
            }
          </h2>
        </div>

        <div
          style={{
            background: "white",
            padding: "30px",
            border:
              "1px solid #ece7df",
          }}
        >
          <p
            style={{
              color: "#9ca3af",
              marginBottom: "10px",
            }}
          >
            Ready Dispatch
          </p>

          <h2
            style={{
              fontSize: "34px",
              fontFamily: "serif",
            }}
          >
            {
              projects.filter(
                (p) =>
                  p.current_stage ===
                  "Dispatch"
              ).length
            }
          </h2>
        </div>
      </div>

      {/* CREATE PROJECT */}

      <section
        style={{
          background: "white",
          padding: "35px",
          marginBottom: "40px",
          border:
            "1px solid #ece7df",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            marginBottom: "30px",
            fontFamily: "serif",
          }}
        >
          Create Project
        </h2>

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          <input
            placeholder="Client Name"
            value={clientName}
            onChange={(e) =>
              setClientName(
                e.target.value
              )
            }
            style={{
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          />

          <input
            placeholder="Client Email"
            value={clientEmail}
            onChange={(e) =>
              setClientEmail(
                e.target.value
              )
            }
            style={{
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          />

          <select
            value={currentStage}
            onChange={(e) =>
              setCurrentStage(
                e.target.value
              )
            }
            style={{
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          >
            <option value="Design">
              Design
            </option>

            <option value="Production">
              Production
            </option>

            <option value="Dispatch">
              Dispatch
            </option>
          </select>

          <button
            onClick={createProject}
            style={{
              padding: "14px",
              background: "#111827",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Create New Project
          </button>
        </div>
      </section>

      {/* PROJECT LIST */}

      <section
        style={{
          background: "white",
          padding: "35px",
          border:
            "1px solid #ece7df",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              fontSize: "26px",
              fontFamily: "serif",
            }}
          >
            Active Projects
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gap: "16px",
          }}
        >
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                border:
                  "1px solid #f3f4f6",
                padding: "24px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                background:
                  "#fafaf9",
              }}
            >
              <div>
                <h3
                  style={{
                    marginBottom: "8px",
                    fontSize: "20px",
                  }}
                >
                  {
                    project.client_name
                  }
                </h3>

                <p
                  style={{
                    color: "#6b7280",
                    marginBottom: "6px",
                  }}
                >
                  Current Stage:{" "}
                  <strong>
                    {
                      project.current_stage
                    }
                  </strong>
                </p>

                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  Progress:{" "}
                  <strong>
                    {
                      project.progress
                    }
                    %
                  </strong>
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() =>
                    router.push(
                      `/admin/projects/${project.id}`
                    )
                  }
                  style={{
                    padding:
                      "12px 18px",
                    border:
                      "1px solid #111827",
                    background:
                      "transparent",
                    cursor: "pointer",
                  }}
                >
                  Open Project
                </button>

                <button
                  onClick={() =>
                    deleteProject(
                      project.id
                    )
                  }
                  style={{
                    padding:
                      "12px 18px",
                    background:
                      "#dc2626",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}