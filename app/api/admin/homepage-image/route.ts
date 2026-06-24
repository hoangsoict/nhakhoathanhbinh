import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const bucketName = "clinic-assets";
const maxImageSizeBytes = 2 * 1024 * 1024;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return jsonError("Ảnh trang chủ là bắt buộc");
    }

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      return jsonError("Chỉ hỗ trợ ảnh PNG, JPG hoặc WebP");
    }

    if (file.size > maxImageSizeBytes) {
      return jsonError("Ảnh trang chủ cần nhỏ hơn 2MB");
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const filePath = `homepage/hero-${Date.now()}.${extension}`;
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from(bucketName).upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

    if (error) {
      return jsonError(error.message, 500);
    }

    const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);
    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Không thể upload ảnh");
  }
}
