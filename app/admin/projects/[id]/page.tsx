"use client";

import { useEffect, useState } from "react";
import supabase from "../../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";

type ChecklistRelation = {
  title: string;
  stage: string;
};

type ChecklistItem = {
  id: string;
  status: string;
  checklist: ChecklistRelation[];
};

type CommentItem = {
  id: string;
  message: string;
  sender_role: string;
  created_at: string;
};

type Project = {
  id: string;
  client_name: string;
  current_stage: string;
  final_design_url: string | null;
  progress: number;
};

export default function ProjectControlPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [project, setProject] =
    useState<Project | null>(null);

  const [items, setItems] =
    useState<ChecklistItem[]>([]);

  const [comments, setComments] =
    useState<CommentItem[]>([]);

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

    await fetchProject();
    await fetchChecklist();
    await fetchComments();

    setLoading(false);
  }

  async function fetchProject() {
    const { data, error } =
      await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

    if (error) {
      console.log(error);
      return;
    }

    setProject(data);
  }

  async function fetchChecklist() {
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

  async function fetchComments() {
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

  async function calculateProgress() {
    const { data, error } =
      await supabase
        .from("project_checklist")
        .select("status")
        .eq("project_id", projectId);

    if (error || !data) {
      console.log(error);
      return;
    }

    const total = data.length;

    if (total === 0) return;

    const doneCount = data.filter(
      (item) =>
        item.status === "done"
    ).length;

    const progress = Math.round(
      (doneCount / total) * 100
    );

    const { error: progressError } =
      await supabase
        .from("projects")
        .update({
          progress,
        })
        .eq("id", projectId);

    if (progressError) {
      console.log(progressError);
      return;
    }

    await fetchProject();
  }

  async function updateStatus(
    id: string,
    currentStatus: string
  ) {
    let nextStatus = "pending";

    if (
      currentStatus === "pending"
    ) {
      nextStatus = "in_progress";
    } else if (
      currentStatus ===
      "in_progress"
    ) {
      nextStatus = "done";
    }

    const { error } = await supabase
      .from("project_checklist")
      .update({
        status: nextStatus,
      })
      .eq("id", id);

    if (error) {
      console.log(error);
      return;
    }

    await fetchChecklist();
    await calculateProgress();
  }

  async function updateStage(
    stage: string
  ) {
    const { error } = await supabase
      .from("projects")
      .update({
        current_stage: stage,
      })
      .eq("id", projectId);

    if (error) {
      console.log(error);
      return;
    }

    await fetchProject();
  }

  async function uploadPdf() {
    if (!selectedFile) {
      alert("Please select PDF");
      return;
    }

    setUploading(true);

    const fileName = `${projectId}-${Date.now()}.pdf`;

    const { error: uploadError } =
      await supabase.storage
        .from("final-designs")
        .upload(
          fileName,
          selectedFile,
          {
            upsert: true,
          }
        );

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicData } =
      supabase.storage
        .from("final-designs")
        .getPublicUrl(fileName);

    const publicUrl =
      publicData.publicUrl;

    const { error: dbError } =
      await supabase
        .from("projects")
        .update({
          final_design_url:
            publicUrl,
        })
        .eq("id", projectId);

    if (dbError) {
      alert(dbError.message);
      setUploading(false);
      return;
    }

    alert("PDF Saved");

    await fetchProject();

    setSelectedFile(null);

    setUploading(false);
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
        Loading Project...
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
              marginBottom: "10px",
              fontSize: "13px",
              textTransform:
                "uppercase",
              letterSpacing: "1px",
            }}
          >
            Project Management Panel
          </p>

          <h1
            style={{
              fontSize: "40px",
              fontFamily: "serif",
            }}
          >
            {project?.client_name}
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#6b7280",
            }}
          >
            Progress:
            {" "}
            {project?.progress || 0}%
          </p>
        </div>

        <button
          onClick={() =>
            router.push("/admin")
          }
          style={{
            padding: "12px 18px",
            border:
              "1px solid #d1d5db",
            background: "white",
            cursor: "pointer",
          }}
        >
          Back Dashboard
        </button>
      </div>

      {/* PROJECT STAGE */}

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
          Current Stage
        </h2>

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          {[
            "Design",
            "Production",
            "Dispatch",
          ].map((stage) => (
            <button
              key={stage}
              onClick={() =>
                updateStage(stage)
              }
              style={{
                padding:
                  "12px 18px",
                border:
                  project?.current_stage ===
                  stage
                    ? "1px solid #111827"
                    : "1px solid #d1d5db",
                background:
                  project?.current_stage ===
                  stage
                    ? "#111827"
                    : "white",
                color:
                  project?.current_stage ===
                  stage
                    ? "white"
                    : "#111827",
                cursor: "pointer",
              }}
            >
              {stage}
            </button>
          ))}
        </div>
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
            marginBottom: "30px",
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
                    <div>
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

                    <button
                      onClick={() =>
                        updateStatus(
                          item.id,
                          item.status
                        )
                      }
                      style={{
                        padding:
                          "10px 16px",
                        background:
                          "#111827",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Update
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </section>

      {/* PDF SECTION */}

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
          Approved Design Package
        </h2>

        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setSelectedFile(
                e.target.files[0]
              );
            }
          }}
        />

        {selectedFile && (
          <p
            style={{
              marginTop: "14px",
              color: "#6b7280",
            }}
          >
            Selected:
            {" "}
            {selectedFile.name}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={uploadPdf}
            style={{
              padding: "12px 18px",
              background: "#111827",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            {!project?.final_design_url
              ? "Submit PDF"
              : "Update PDF"}
          </button>
        </div>

        {uploading && (
          <p
            style={{
              marginTop: "14px",
            }}
          >
            Uploading PDF...
          </p>
        )}

        {project?.final_design_url && (
          <div
            style={{
              marginTop: "20px",
            }}
          >
            <a
              href={
                project.final_design_url
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              View Approved PDF
            </a>
          </div>
        )}
      </section>

      {/* COMMENTS */}

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
          Client Communication
        </h2>

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
    </main>
  );
}