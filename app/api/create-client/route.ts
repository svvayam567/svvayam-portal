import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

import { Resend } from "resend";

const supabaseAdmin =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();

    const {
      clientName,
      clientEmail,
      currentStage,
    } = body;

    const password =
      Math.random()
        .toString(36)
        .slice(-8) + "A1!";

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email: clientEmail,
          password,
          email_confirm: true,
        }
      );

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          error:
            authError?.message ||
            "User creation failed",
        },
        {
          status: 500,
        }
      );
    }

    const userId =
      authData.user.id;

    const {
      error: userInsertError,
    } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email: clientEmail,
        role: "client",
      });

    if (userInsertError) {
      return NextResponse.json(
        {
          error:
            userInsertError.message,
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: projectData,
      error: projectError,
    } = await supabaseAdmin
      .from("projects")
      .insert({
        client_id: userId,
        client_name: clientName,
        client_email:
          clientEmail,
        current_stage:
          currentStage,
        status: "active",
        progress: 0,
      })
      .select()
      .single();

    if (
      projectError ||
      !projectData
    ) {
      return NextResponse.json(
        {
          error:
            projectError?.message,
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: masterChecklist,
    } = await supabaseAdmin
      .from("checklist")
      .select("*");

    if (masterChecklist) {
      const checklistRows =
        masterChecklist.map(
          (item: any) => ({
            project_id:
              projectData.id,
            checklist_id:
              item.id,
            status: "pending",
          })
        );

      await supabaseAdmin
        .from(
          "project_checklist"
        )
        .insert(checklistRows);
    }

    await resend.emails.send({
      from:
        "SVVAYAM <marketing@svvayam.com>",
      to: clientEmail,
      subject:
        "Your Project Portal Access",

      html: `
      <div style="font-family:sans-serif;padding:30px;">
        
        <h2>
          Welcome to SVVAYAM Project Portal
        </h2>

        <p>
          Your account has been created successfully.
        </p>

        <p>
          <strong>Login URL:</strong><br/>
          https://YOUR-PROJECT.vercel.app/login
        </p>

        <p>
          <strong>Email:</strong><br/>
          ${clientEmail}
        </p>

        <p>
          <strong>Password:</strong><br/>
          ${password}
        </p>

        <p>
          Please change your password after login.
        </p>

      </div>
      `,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}