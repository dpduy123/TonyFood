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

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(
        "id,order_number,customer_name,customer_phone,delivery_address,note,admin_note,is_paid,status,subtotal,total,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (ordersError) {
      console.error("Admin order listing failed.", ordersError.message);
      return NextResponse.json(
        { error: "Không thể tải danh sách đơn hàng." },
        { status: 502 }
      );
    }

    const orderIds = (orders ?? []).map((order) => order.id);
    const { data: items, error: itemsError } =
      orderIds.length > 0
        ? await supabase
            .from("order_items")
            .select(
              "id,order_id,product_name,product_unit,quantity,unit_price,total_price"
            )
            .in("order_id", orderIds)
        : { data: [], error: null };

    if (itemsError) {
      console.error("Admin order items query failed.", itemsError.message);
      return NextResponse.json(
        { error: "Không thể tải chi tiết đơn hàng." },
        { status: 502 }
      );
    }

    const itemsByOrder = new Map<string, typeof items>();
    for (const item of items ?? []) {
      const orderItems = itemsByOrder.get(item.order_id) ?? [];
      orderItems.push(item);
      itemsByOrder.set(item.order_id, orderItems);
    }

    return NextResponse.json({
      orders: (orders ?? []).map((order) => ({
        ...order,
        items: itemsByOrder.get(order.id) ?? [],
      })),
    });
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
