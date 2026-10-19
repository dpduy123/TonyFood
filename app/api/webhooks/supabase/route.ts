import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedTables = new Set([
  "orders",
  "products",
  "categories",
  "tags",
  "product_tags",
]);
const maxBodyBytes = 64 * 1024;
const retentionDays = 90;

interface SupabaseDatabaseWebhook {
  type: "INSERT" | "UPDATE" | "DELETE";
  schema: "public";
  table: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidSecret(request: Request, expected: string): boolean {
  const received = request.headers.get("x-webhook-secret");
  if (!received) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function isWebhookPayload(value: unknown): value is SupabaseDatabaseWebhook {
  if (!isRecord(value)) return false;
  return (
    (value.type === "INSERT" ||
      value.type === "UPDATE" ||
      value.type === "DELETE") &&
    value.schema === "public" &&
    typeof value.table === "string" &&
    allowedTables.has(value.table) &&
    (value.record === null || isRecord(value.record)) &&
    (value.old_record === null || isRecord(value.old_record))
  );
}

function getRowId(event: SupabaseDatabaseWebhook): string | null {
  const row = event.record ?? event.old_record;
  if (!row) return null;
  if (typeof row.id === "string") return row.id;
  if (
    event.table === "product_tags" &&
    typeof row.product_id === "string" &&
    typeof row.tag_id === "string"
  ) {
    return `${row.product_id}:${row.tag_id}`;
  }
  return null;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.error("Supabase webhook receiver is not configured: SUPABASE_WEBHOOK_SECRET is missing.");
    return NextResponse.json({ error: "Webhook receiver is not configured." }, { status: 503 });
  }
  if (!hasValidSecret(request, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maxBodyBytes) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > maxBodyBytes) {
      return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Webhook payload must be valid JSON." }, { status: 400 });
  }

  if (!isWebhookPayload(payload)) {
    return NextResponse.json({ error: "Unsupported webhook event." }, { status: 400 });
  }

  const rowId = getRowId(payload);
  if (!rowId) {
    return NextResponse.json({ error: "Webhook event has no supported row ID." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("webhook_event_logs").insert({
      schema_name: payload.schema,
      table_name: payload.table,
      event_type: payload.type,
      row_id: rowId,
    });
    if (error) {
      console.error("Persisting Supabase webhook event failed.", {
        table: payload.table,
        type: payload.type,
        error: error.message,
      });
      return NextResponse.json({ error: "Could not record webhook event." }, { status: 502 });
    }

    const retentionCutoff = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const { error: cleanupError } = await supabase
      .from("webhook_event_logs")
      .delete()
      .lt("received_at", retentionCutoff);
    if (cleanupError) {
      console.error("Webhook event log retention cleanup failed.", cleanupError.message);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(
      "Supabase webhook receiver failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json({ error: "Webhook receiver is unavailable." }, { status: 503 });
  }
}
