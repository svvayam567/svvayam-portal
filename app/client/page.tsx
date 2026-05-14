"use client";

import {
  useEffect,
  useState,
} from "react";

import supabase from "../../lib/supabase";

import { useRouter } from "next/navigation";

type Project = {
  id: string;
  client_name: string;
  current_stage: string;
  progress: number;
  final_design_url: string | null;
  design_status: string;
  design_feedback: string | null;
};

type ChecklistItem = {
  id: string;
  status: string;
  checklist: {
    title: string;
    stage: string;
  }[];
};

type CommentItem = {
  id: string;
  message: string;
  sender_role: string;
  created_at: string;
};

export default function ClientDashboard() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [project, setProject] =
    useState<Project | null>(null);

  const [items, setItems] =
    useState<ChecklistItem[]>([]);

  const [comments, setComments] =
    useState<CommentItem[]>([]);

  const [message, setMessage] =
    useState("");

  const [feedback, setFeedback] =
  useState("");

  useEffect(() => {
    let realtimeChannel: any;

    async function start() {
      realtimeChannel =
        await initialize();
    }

    start();

    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(
          realtimeChannel
        );
      }
    };
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

    if (roleData?.role !== "client") {
      router.replace("/admin");
      return;
    }

    const { data: projectData } =
      await supabase
        .from("projects")
        .select("*")
        .eq("client_id", user.id)
        .single();

    if (!projectData) {
      setLoading(false);
      return;
    }

    setProject(projectData);

    await fetchChecklist(
      projectData.id
    );

    await fetchComments(
      projectData.id
    );

    setLoading(false);

    return setupRealtime(
      projectData.id
    );
  }

  async function fetchChecklist(
    projectId: string
  ) {
    const { data, error } =
      await supabase
        .from("project_checklist")
        .select(`
          id,
          status,
          checklist:checklist_id (
            title,
            stage
          )
        `)
        .eq("project_id", projectId);

    if (error) {
      console.log(error);
      return;
    }

    setItems(
      (data as unknown as ChecklistItem[]) ||
        []
    );
  }

  async function fetchComments(
    projectId: string
  ) {
    const { data, error } =
      await supabase
        .from("comments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.log(error);
      return;
    }

    setComments(data || []);
  }

 function setupRealtime(
  projectId: string
) {
  const existingChannels =
    supabase.getChannels();

  existingChannels.forEach(
    (channel) => {
      if (
        channel.topic ===
        `realtime:client-realtime-${projectId}`
      ) {
        supabase.removeChannel(
          channel
        );
      }
    }
  );

  const channel =
    supabase.channel(
      `client-realtime-${projectId}`
    );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table:
        "project_checklist",
      filter: `project_id=eq.${projectId}`,
    },
    async () => {
      await fetchChecklist(
        projectId
      );
    }
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "projects",
      filter: `id=eq.${projectId}`,
    },
    async () => {
      const { data } =
        await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

      if (data) {
        setProject(data);
      }
    }
  );

  channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "comments",
      filter: `project_id=eq.${projectId}`,
    },
    async () => {
      await fetchComments(
        projectId
      );
    }
  );

  channel.subscribe();

  return channel;
}

  async function sendComment() {
    if (
      !message.trim() ||
      !project
    )
      return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("comments")
      .insert({
        project_id: project.id,
        sender_id: user?.id,
        sender_role: "client",
        message,
      });

    if (error) {
      console.log(error);
      return;
    }

    setMessage("");
  }

async function approveDesign() {
  if (!project) return;

  const { error } = await supabase
    .from("projects")
    .update({
      design_status: "approved",
      current_stage: "Production",
    })
    .eq("id", project.id);

  if (error) {
    alert(JSON.stringify(error));
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("comments")
    .insert({
      project_id: project.id,
      sender_id: user?.id,
      sender_role: "client",
      message:
        "Design approved by client.",
    });

  alert("Design Approved");
}

async function requestChanges() {
  if (!project) return;

  if (!feedback.trim()) {
    alert(
      "Enter feedback first"
    );
    return;
  }

  const { error } = await supabase
    .from("projects")
    .update({
      design_status:
        "changes_requested",
      design_feedback: feedback,
    })
    .eq("id", project.id);

  if (error) {
    alert(JSON.stringify(error));
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase
    .from("comments")
    .insert({
      project_id: project.id,
      sender_id: user?.id,
      sender_role: "client",
      message: `Requested Changes: ${feedback}`,
    });

  setFeedback("");

  alert("Changes Requested");
}

  async function logout() {
    await supabase.auth.signOut();

    router.replace("/login");
  }

  const grouped = {
    Design: items.filter(
      (i) =>
        i.checklist?.[0]?.stage ===
        "Design"
    ),

    Production: items.filter(
      (i) =>
        i.checklist?.[0]?.stage ===
        "Production"
    ),

    Dispatch: items.filter(
      (i) =>
        i.checklist?.[0]?.stage ===
        "Dispatch"
    ),
  };

  if (loading) {
    return (
      <main style={{ padding: 40 }}>
        Loading Dashboard...
      </main>
    );
  }

  if (!project) {
    return (
      <main style={{ padding: 40 }}>
        No project assigned yet.
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8f6f2",
        padding: "50px",
        fontFamily:
          "Inter, sans-serif",
        color: "#111827",
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
            Client Project Portal
          </p>

          <h1
            style={{
              fontSize: "42px",
              fontFamily: "serif",
            }}
          >
            {project.client_name}
          </h1>
        </div>

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

      {/* STATUS */}

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
          Project Status
        </h2>

        <p
          style={{
            marginBottom: "16px",
          }}
        >
          Current Stage:
          {" "}
          <strong>
            {project.current_stage}
          </strong>
        </p>

        <div
          style={{
            width: "100%",
            height: "14px",
            background: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${project.progress}%`,
              height: "100%",
              background: "#111827",
            }}
          />
        </div>

        <p
          style={{
            marginTop: "10px",
          }}
        >
          {project.progress}% Completed
        </p>
      </section>

      {/* CHECKLIST */}

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
            marginBottom: "24px",
            fontFamily: "serif",
          }}
        >
          Project Checklist
        </h2>

        {Object.entries(grouped).map(
          ([stage, stageItems]) => (
            <div
              key={stage}
              style={{
                marginBottom: "30px",
              }}
            >
              <h3
                style={{
                  marginBottom: "14px",
                  color: "#6b7280",
                }}
              >
                {stage}
              </h3>

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
                      padding: "18px",
                      border:
                        "1px solid #f3f4f6",
                      background:
                        "#fafaf9",
                    }}
                  >
                    <p>
                      {
                        item
                          .checklist?.[0]
                          ?.title
                      }
                    </p>

                    <small>
                      Status:
                      {" "}
                      {item.status}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </section>

      

      {/* FINAL DESIGN */}

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
    Final Approved Design
  </h2>

  {project.final_design_url ? (
    <>
      <a
        href={
          project.final_design_url
        }
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#111827",
          textDecoration:
            "underline",
          display: "block",
          marginBottom: "24px",
        }}
      >
        View Approved PDF
      </a>

      <div
        style={{
          marginBottom: "20px",
        }}
      >
        <strong>
          Design Status:
        </strong>{" "}
        {project.design_status}
      </div>

      {project.design_status !==
        "approved" && (
        <>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <button
              onClick={
                approveDesign
              }
              style={{
                padding:
                  "12px 18px",
                background:
                  "#111827",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Approve Design
            </button>

            <button
              onClick={
                requestChanges
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
              Request Changes
            </button>
          </div>

          <textarea
            placeholder="Enter change request feedback..."
            value={feedback}
            onChange={(e) =>
              setFeedback(
                e.target.value
              )
            }
            style={{
              width: "100%",
              height: "120px",
              padding: "14px",
              border:
                "1px solid #d1d5db",
            }}
          />
        </>
      )}

      {project.design_feedback && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background:
              "#fafaf9",
            border:
              "1px solid #ece7df",
          }}
        >
          <strong>
            Latest Feedback:
          </strong>

          <p
            style={{
              marginTop: "10px",
            }}
          >
            {
              project.design_feedback
            }
          </p>
        </div>
      )}
    </>
  ) : (
    <p>No approved PDF yet.</p>
  )}
</section>

      {/* COMMENTS */}

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
          Communication
        </h2>

        <textarea
          value={message}
          onChange={(e) =>
            setMessage(
              e.target.value
            )
          }
          placeholder="Type message..."
          style={{
            width: "100%",
            height: "120px",
            padding: "14px",
            border:
              "1px solid #d1d5db",
            marginBottom: "16px",
          }}
        />

        <button
          onClick={sendComment}
          style={{
            padding: "12px 18px",
            background: "#111827",
            color: "white",
            border: "none",
            cursor: "pointer",
            marginBottom: "30px",
          }}
        >
          Submit Comment
        </button>

        <div
          style={{
            display: "grid",
            gap: "14px",
          }}
        >
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: "18px",
                border:
                  "1px solid #f3f4f6",
                background:
                  comment.sender_role ===
                  "client"
                    ? "#fafaf9"
                    : "#f9fafb",
              }}
            >
              <small>
                {comment.sender_role}
              </small>

              <p
                style={{
                  marginTop: "8px",
                }}
              >
                {comment.message}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CHANGE REQUEST */}

      <section
        style={{
          background: "white",
          padding: "30px",
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
          Request Change
        </h2>

        <button
          onClick={() =>
            window.open(
              "https://calendly.com",
              "_blank"
            )
          }
          style={{
            padding: "12px 18px",
            background: "#111827",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Schedule Meeting
        </button>
      </section>
    </main>
  );
}