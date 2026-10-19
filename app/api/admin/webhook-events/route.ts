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

    const { data, error } = await supabase
      .from("webhook_event_logs")
      .select("id,schema_name,table_name,event_type,row_id,received_at")
      .order("received_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin webhook event listing failed.", error.message);
      return NextResponse.json({ error: "Không thể tải lịch sử webhook." }, { status: 502 });
    }

    return NextResponse.json({ events: data ?? [] });
  } catch (error) {
    console.error(
      "Admin webhook event API failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Dịch vụ lịch sử webhook hiện không khả dụng." },
      { status: 503 }
    );
  }
}
