import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface CheckoutItem {
  slug: string;
  quantity: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getTrimmedString(
  value: unknown,
  minLength: number,
  maxLength: number
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength
    ? trimmed
    : null;
}

function mapOrderError(message: string) {
  if (message.includes("INSUFFICIENT_STOCK")) {
    return {
      status: 409,
      message: "Một số sản phẩm không còn đủ hàng. Vui lòng kiểm tra lại giỏ hàng.",
    };
  }
  if (message.includes("PRODUCT_NOT_AVAILABLE")) {
    return {
      status: 409,
      message: "Một sản phẩm trong giỏ hiện không còn được bán.",
    };
  }
  if (message.includes("INVALID_CUSTOMER_DETAILS")) {
    return { status: 400, message: "Thông tin giao hàng chưa hợp lệ." };
  }
  if (
    message.includes("INVALID_ORDER_ITEMS") ||
    message.includes("DUPLICATE_ORDER_ITEMS")
  ) {
    return { status: 400, message: "Danh sách sản phẩm trong giỏ chưa hợp lệ." };
  }
  return { status: 500, message: "Không thể tạo đơn hàng lúc này." };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const customerName = getTrimmedString(body.customerName, 2, 120);
  const customerPhone = getTrimmedString(body.customerPhone, 8, 30);
  const deliveryAddress = getTrimmedString(body.deliveryAddress, 5, 500);
  const note =
    body.note === undefined || body.note === null || body.note === ""
      ? null
      : getTrimmedString(body.note, 0, 1000);
  const rawItems = body.items;

  if (
    !customerName ||
    !customerPhone ||
    !/^[+\d()\s-]{8,30}$/.test(customerPhone) ||
    customerPhone.replace(/\D/g, "").length < 8 ||
    customerPhone.replace(/\D/g, "").length > 15 ||
    !deliveryAddress ||
    (body.note !== undefined &&
      body.note !== null &&
      body.note !== "" &&
      note === null) ||
    !Array.isArray(rawItems) ||
    rawItems.length < 1 ||
    rawItems.length > 50
  ) {
    return NextResponse.json(
      { error: "Vui lòng kiểm tra thông tin giao hàng và giỏ hàng." },
      { status: 400 }
    );
  }

  const items: CheckoutItem[] = [];
  const seenSlugs = new Set<string>();
  for (const value of rawItems) {
    if (
      !isRecord(value) ||
      typeof value.slug !== "string" ||
      !/^[a-z0-9-]{1,100}$/.test(value.slug) ||
      !Number.isInteger(value.quantity) ||
      Number(value.quantity) < 1 ||
      Number(value.quantity) > 99 ||
      seenSlugs.has(value.slug)
    ) {
      return NextResponse.json(
        { error: "Danh sách sản phẩm trong giỏ chưa hợp lệ." },
        { status: 400 }
      );
    }
    seenSlugs.add(value.slug);
    items.push({ slug: value.slug, quantity: Number(value.quantity) });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("create_guest_order", {
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_delivery_address: deliveryAddress,
      p_note: note,
      p_items: items,
    });

    if (error) {
      const mapped = mapOrderError(error.message);
      if (mapped.status >= 500) {
        console.error("Guest order creation failed.", error.message);
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (error) {
    console.error(
      "Guest order API configuration failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Dịch vụ đặt hàng hiện không khả dụng." },
      { status: 503 }
    );
  }
}
