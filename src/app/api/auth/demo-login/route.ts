import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = body.email || "admin@acmetech.io";
    const normalizedEmail = String(email).trim().toLowerCase();

    // Determine role from email
    let role = "owner";
    if (normalizedEmail.includes("senior") || normalizedEmail.includes("operations")) {
      role = "senior_manager";
    } else if (normalizedEmail.includes("junior") || normalizedEmail.includes("jr")) {
      role = "junior_manager";
    }

    const response = NextResponse.json({
      success: true,
      email: normalizedEmail,
      role,
      redirectTo: "/app/demo-corp/overview",
    });

    const maxAge = 60 * 60 * 24 * 7; // 7 days

    // Set cookies on response
    response.cookies.set({
      name: "roos_session",
      value: "true",
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    response.cookies.set({
      name: "roos_user_role",
      value: role,
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    response.cookies.set({
      name: "roos_user_email",
      value: normalizedEmail,
      path: "/",
      maxAge,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to establish demo session" },
      { status: 500 }
    );
  }
}
