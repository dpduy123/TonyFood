import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  isAdminRequest,
} from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdminClient();
    if (!(await isAdminRequest(request, supabase))) {
      return NextResponse.json({ error: "Bạn không có quyền truy cập." }, { status: 403 });
    }

    const { data, error } = await supabase.rpc("api_admin_orders");
    if (error) {
      console.error("Admin orders RPC failed.", error.message);
      return NextResponse.json(
        { error: "Không thể tải danh sách đơn hàng." },
        { status: 502 }
      );
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (error) {
    console.error(
      "Admin order API configuration failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Dịch vụ quản lý đơn hàng hiện không khả dụng." },
      { status: 503 }
    );
  }
}
