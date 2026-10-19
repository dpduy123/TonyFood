import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  isAdminRequest,
} from "@/lib/supabase/admin";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);
const maxSize = 5 * 1024 * 1024;
const bucketName = "FoodImage";

function validProductId(value: FormDataEntryValue | null): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!(await isAdminRequest(request, supabase))) {
      return NextResponse.json({ error: "Bạn không có quyền truy cập." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const productId = formData.get("productId");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Vui lòng chọn ảnh sản phẩm." }, { status: 400 });
    }
    if (!validProductId(productId)) {
      return NextResponse.json({ error: "Sản phẩm không hợp lệ." }, { status: 400 });
    }
    const extension = allowedTypes.get(file.type);
    if (!extension || file.size < 1 || file.size > maxSize) {
      return NextResponse.json(
        { error: "Ảnh phải là JPEG, PNG, WebP hoặc AVIF và không quá 5 MB." },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();
    if (productError) {
      console.error("Product lookup for image upload failed.", productError.message);
      return NextResponse.json({ error: "Không thể xác minh sản phẩm." }, { status: 502 });
    }
    if (!product) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm." }, { status: 404 });
    }

    const path = `${productId}/image`;
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) {
      console.error("Product image upload failed.", error.message);
      return NextResponse.json({ error: "Không thể tải ảnh lên Storage." }, { status: 502 });
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, productId }, { status: 201 });
  } catch (error) {
    console.error("Product image upload API failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Dịch vụ tải ảnh hiện không khả dụng." }, { status: 503 });
  }
}
