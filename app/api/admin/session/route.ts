import { NextRequest, NextResponse } from "next/server";
import { authenticateStaff, createStaffToken } from "@/lib/admin-auth";
import { requireText } from "@/lib/appointments";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = requireText(body.username, "Tên đăng nhập");
    const password = requireText(body.password, "Mật khẩu");
    const staff = await authenticateStaff(username, password);

    if (!staff) {
      return jsonError("Tên đăng nhập hoặc mật khẩu không đúng", 401);
    }

    return NextResponse.json({
      token: createStaffToken(staff.username, staff.role),
      username: staff.username,
      role: staff.role
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Không thể đăng nhập");
  }
}
