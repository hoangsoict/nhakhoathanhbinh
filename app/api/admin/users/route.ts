import { NextRequest, NextResponse } from "next/server";
import { hashPassword, requireStaff } from "@/lib/admin-auth";
import { requireText } from "@/lib/appointments";
import { getSupabaseAdmin } from "@/lib/supabase";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const { data, error } = await getSupabaseAdmin()
      .from("staff_users")
      .select("id, username, role, active, created_at, updated_at")
      .eq("role", "maintain")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ users: data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Không thể tải danh sách user");
  }
}

export async function POST(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const body = await request.json();
    const username = requireText(body.username, "Tên đăng nhập");
    const password = requireText(body.password, "Mật khẩu");

    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
      return jsonError("Tên đăng nhập chỉ dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang");
    }

    if (password.length < 6) {
      return jsonError("Mật khẩu cần tối thiểu 6 ký tự");
    }

    const { data, error } = await getSupabaseAdmin()
      .from("staff_users")
      .insert({
        username,
        password_hash: hashPassword(password),
        role: "maintain",
        active: true
      })
      .select("id, username, role, active, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError("Tên đăng nhập này đã tồn tại", 409);
      }

      return jsonError(error.message, 500);
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Không thể tạo user");
  }
}

export async function PATCH(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const body = await request.json();
    const userId = requireText(body.userId, "User");
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (typeof body.active === "boolean") {
      payload.active = body.active;
    }

    if (typeof body.password === "string" && body.password.trim()) {
      if (body.password.length < 6) {
        return jsonError("Mật khẩu cần tối thiểu 6 ký tự");
      }

      payload.password_hash = hashPassword(body.password);
    }

    const { data, error } = await getSupabaseAdmin()
      .from("staff_users")
      .update(payload)
      .eq("id", userId)
      .eq("role", "maintain")
      .select("id, username, role, active, created_at, updated_at")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Không thể cập nhật user");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const body = await request.json();
    const userId = requireText(body.userId, "User");
    const { error } = await getSupabaseAdmin()
      .from("staff_users")
      .delete()
      .eq("id", userId)
      .eq("role", "maintain");

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Không thể xóa user");
  }
}
