import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  isAdminRequest,
} from "@/lib/supabase/admin";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function authorize(request: Request) {
  const supabase = createSupabaseAdminClient();
  if (!(await isAdminRequest(request, supabase))) {
    return { supabase: null, response: NextResponse.json({ error: "Bạn không có quyền truy cập." }, { status: 403 }) };
  }
  return { supabase, response: null };
}

export async function GET(request: Request) {
  try {
    const auth = await authorize(request);
    if (!auth.supabase) return auth.response;
    const supabase = auth.supabase;

    const { data, error } = await supabase.rpc("api_admin_catalog");
    if (error) {
      console.error("Admin catalog RPC failed.", error.message);
      return NextResponse.json({ error: "Không thể tải danh mục quản trị." }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin catalog API failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Dịch vụ quản lý sản phẩm hiện không khả dụng." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize(request);
    if (!auth.supabase) return auth.response;
    const supabase = auth.supabase;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
    }

    if (!isObject(body) || typeof body.action !== "string") {
      return NextResponse.json({ error: "Thao tác danh mục không hợp lệ." }, { status: 400 });
    }

    if (body.action === "save_product") {
      const product = body.product;
      if (
        !isObject(product) ||
        (product.id !== null && product.id !== undefined && !validId(product.id)) ||
        typeof product.name !== "string" ||
        typeof product.slug !== "string" ||
        typeof product.unit !== "string" ||
        typeof product.price !== "number" ||
        !Number.isFinite(product.price) ||
        !Number.isInteger(product.stock) ||
        !validId(product.categoryId) ||
        !Array.isArray(product.tagIds) ||
        !product.tagIds.every(validId) ||
        (product.imageUrl !== null && typeof product.imageUrl !== "string") ||
        (product.status !== "ACTIVE" && product.status !== "DRAFT")
      ) {
        return NextResponse.json({ error: "Thông tin sản phẩm chưa hợp lệ." }, { status: 400 });
      }

      const { data, error } = await supabase.rpc("admin_save_product", {
        p_id: product.id ?? null,
        p_name: product.name,
        p_slug: product.slug || slugify(product.name),
        p_short_description:
          typeof product.subtitle === "string" ? product.subtitle : null,
        p_price: product.price,
        p_unit: product.unit,
        p_stock: product.stock,
        p_category_id: product.categoryId,
        p_tag_ids: product.tagIds,
        p_image_url: product.imageUrl,
        p_status: product.status,
      });
      if (error) {
        const conflict = error.code === "23505";
        if (!conflict) console.error("Saving product failed.", error.message);
        return NextResponse.json(
          { error: conflict ? "Tên hoặc đường dẫn sản phẩm đã tồn tại." : "Không thể lưu sản phẩm." },
          { status: conflict ? 409 : 400 }
        );
      }
      return NextResponse.json({ productId: data }, { status: product.id ? 200 : 201 });
    }

    if (body.action === "archive_product") {
      if (!validId(body.productId)) {
        return NextResponse.json({ error: "Sản phẩm không hợp lệ." }, { status: 400 });
      }
      const { error } = await supabase
        .from("products")
        .update({ status: "ARCHIVED" })
        .eq("id", body.productId);
      if (error) {
        console.error("Archiving product failed.", error.message);
        return NextResponse.json({ error: "Không thể ẩn sản phẩm." }, { status: 400 });
      }
      return NextResponse.json({ archived: true });
    }

    if (body.action === "save_category" || body.action === "delete_category") {
      const deleting = body.action === "delete_category";
      if (
        (body.id !== null && body.id !== undefined && !validId(body.id)) ||
        (!deleting && typeof body.name !== "string")
      ) {
        return NextResponse.json({ error: "Danh mục chưa hợp lệ." }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("admin_manage_category", {
        p_action: deleting ? "delete" : "save",
        p_id: body.id ?? null,
        p_name: typeof body.name === "string" ? body.name : "",
        p_slug: typeof body.slug === "string" ? body.slug : slugify(String(body.name ?? "")),
      });
      if (error) {
        const inUse = error.code === "23503";
        if (!inUse && error.code !== "23505") console.error("Category update failed.", error.message);
        return NextResponse.json(
          { error: inUse ? "Không thể xóa danh mục đang được sản phẩm sử dụng." : "Không thể lưu danh mục." },
          { status: inUse || error.code === "23505" ? 409 : 400 }
        );
      }
      return NextResponse.json({ category: data });
    }

    if (body.action === "save_tag" || body.action === "delete_tag") {
      const deleting = body.action === "delete_tag";
      if (
        (body.id !== null && body.id !== undefined && !validId(body.id)) ||
        (!deleting && typeof body.name !== "string")
      ) {
        return NextResponse.json({ error: "Nhãn chưa hợp lệ." }, { status: 400 });
      }
      const { data, error } = await supabase.rpc("admin_manage_tag", {
        p_action: deleting ? "delete" : "save",
        p_id: body.id ?? null,
        p_name: typeof body.name === "string" ? body.name : "",
        p_slug: typeof body.slug === "string" ? body.slug : slugify(String(body.name ?? "")),
      });
      if (error) {
        if (error.code !== "23505") console.error("Tag update failed.", error.message);
        return NextResponse.json(
          { error: error.code === "23505" ? "Tên hoặc đường dẫn nhãn đã tồn tại." : "Không thể lưu nhãn." },
          { status: error.code === "23505" ? 409 : 400 }
        );
      }
      return NextResponse.json({ tag: data });
    }

    return NextResponse.json({ error: "Thao tác danh mục không được hỗ trợ." }, { status: 400 });
  } catch (error) {
    console.error("Admin catalog mutation failed.", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Dịch vụ quản lý sản phẩm hiện không khả dụng." }, { status: 503 });
  }
}
