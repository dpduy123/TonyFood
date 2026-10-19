import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  isAdminRequest,
} from "@/lib/supabase/admin";

function mapActionError(message: string) {
  if (message.includes("INSUFFICIENT_STOCK")) {
    return {
      status: 409,
      message: "Không đủ tồn kho để xác nhận đơn này.",
    };
  }
  if (message.includes("ORDER_NOT_FOUND")) {
    return { status: 404, message: "Không tìm thấy đơn hàng." };
  }
  if (message.includes("ORDER_NOT_PENDING")) {
    return { status: 409, message: "Đơn hàng này không còn chờ xác nhận." };
  }
  return { status: 400, message: "Thao tác với đơn hàng không hợp lệ." };
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!(await isAdminRequest(request, supabase))) {
      return NextResponse.json({ error: "Bạn không có quyền truy cập." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("orderId" in body) ||
      typeof body.orderId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.orderId)
    ) {
      return NextResponse.json({ error: "Thao tác với đơn hàng không hợp lệ." }, { status: 400 });
    }

    if ("action" in body && (body.action === "confirm" || body.action === "cancel")) {
      const { data, error } = await supabase.rpc("manage_guest_order", {
        p_order_id: body.orderId,
        p_action: body.action,
      });

      if (error) {
        const mapped = mapActionError(error.message);
        if (mapped.status === 400) {
          console.error("Admin order action failed.", error.message);
        }
        return NextResponse.json({ error: mapped.message }, { status: mapped.status });
      }

      return NextResponse.json({ order: data });
    }

    if (
      !("isPaid" in body) ||
      typeof body.isPaid !== "boolean" ||
      !("adminNote" in body) ||
      (body.adminNote !== null &&
        typeof body.adminNote !== "string") ||
      (typeof body.adminNote === "string" && body.adminNote.length > 2000)
    ) {
      return NextResponse.json({ error: "Thông tin thanh toán hoặc ghi chú không hợp lệ." }, { status: 400 });
    }

    const { data: details, error: detailsError } = await supabase.rpc(
      "update_guest_order_admin_fields",
      {
        p_order_id: body.orderId,
        p_is_paid: body.isPaid,
        p_admin_note: body.adminNote,
      }
    );

    if (detailsError) {
      const mapped =
        detailsError.message.includes("ORDER_NOT_FOUND")
          ? { status: 404, message: "Không tìm thấy đơn hàng." }
          : { status: 400, message: "Không thể lưu ghi chú đơn hàng." };
      if (mapped.status === 400) {
        console.error("Saving admin order details failed.", detailsError.message);
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    return NextResponse.json({ order: details });
  } catch (error) {
    console.error(
      "Admin order action API configuration failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Dịch vụ quản lý đơn hàng hiện không khả dụng." },
      { status: 503 }
    );
  }
}
