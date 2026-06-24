import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const bucketName = "clinic-assets";
const maxImageSizeBytes = 2 * 1024 * 1024;

function isAuthorized(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  return Boolean(adminPin && request.headers.get("x-admin-pin") === adminPin);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError("Vui lòng nhập đúng PIN admin", 401);
  }

  try {
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
    return jsonError(error instanceof Error ? error.message : "Không thể upload ảnh");
  }
}
