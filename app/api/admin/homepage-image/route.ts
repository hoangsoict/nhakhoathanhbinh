import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireStaff } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const bucketName = "clinic-assets";
const maxImageSizeBytes = 2 * 1024 * 1024;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getStoragePathFromPublicUrl(imageUrl: string) {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const markerIndex = imageUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const pathWithQuery = imageUrl.slice(markerIndex + marker.length);
  const [path] = pathWithQuery.split("?");

  if (!path) {
    return null;
  }

  return decodeURIComponent(path);
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
    const filePath = `homepage/hero-${Date.now()}-${randomUUID()}.${extension}`;
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

export async function DELETE(request: NextRequest) {
  try {
    requireStaff(request, ["admin"]);
    const body = await request.json();
    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!imageUrl) {
      return jsonError("URL ảnh là bắt buộc");
    }

    const storagePath = getStoragePathFromPublicUrl(imageUrl);
    if (!storagePath) {
      return jsonError("Ảnh này không nằm trong storage trang chủ");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from(bucketName).remove([storagePath]);

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Vui lòng đăng nhập bằng tài khoản admin", 401);
    }

    return jsonError(error instanceof Error ? error.message : "Không thể xóa ảnh");
  }
}
