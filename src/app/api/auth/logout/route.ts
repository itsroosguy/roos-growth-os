import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, redirectTo: "/login" });

  response.cookies.set({
    name: "roos_session",
    value: "",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "roos_user_role",
    value: "",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set({
    name: "roos_user_email",
    value: "",
    path: "/",
    maxAge: 0,
  });

  return response;
}
