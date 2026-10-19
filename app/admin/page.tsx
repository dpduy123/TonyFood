"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { logClientRequestFailure } from "@/lib/client-request-log";
import AdminCatalogPanel from "./catalog-panel";

interface AdminOrderItem {
  id: string;
  product_name: string;
  product_unit: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
}

interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  note: string | null;
  admin_note: string | null;
  is_paid: boolean;
  status: string;
  subtotal: number | string;
  total: number | string;
  created_at: string;
  items: AdminOrderItem[];
}

interface WebhookEvent {
  id: string;
  schema_name: string;
  table_name: string;
  event_type: "INSERT" | "UPDATE" | "DELETE";
  row_id: string;
  received_at: string;
}

function formatPrice(value: number | string) {
  return new Intl.NumberFormat("vi-VN").format(Number(value)) + "₫";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
}

export default function AdminPage() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingWebhookEvents, setLoadingWebhookEvents] = useState(false);
  const [workingOrder, setWorkingOrder] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeSection, setActiveSection] = useState<
    "products" | "orders" | "webhooks"
  >("orders");

  const loadOrders = useCallback(async (token: string) => {
    setLoading(true);
    let status: number | null = null;
    try {
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      status = response.status;
      const payload = (await response.json()) as {
        orders?: AdminOrder[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(payload.orders)) {
        throw new Error(payload.error ?? "Không thể tải đơn hàng.");
      }
      setOrders(payload.orders);
      setAdminNotes((current) => {
        const next = { ...current };
        for (const order of payload.orders ?? []) {
          if (!(order.id in next)) next[order.id] = order.admin_note ?? "";
        }
        return next;
      });
    } catch (loadError) {
      logClientRequestFailure("GET /api/admin/orders", status, loadError);
      if (status === 401 || status === 403) {
        setAccessToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWebhookEvents = useCallback(async (token: string) => {
    setLoadingWebhookEvents(true);
    let status: number | null = null;
    try {
      const response = await fetch("/api/admin/webhook-events", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      status = response.status;
      const payload = (await response.json()) as {
        events?: WebhookEvent[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(payload.events)) {
        throw new Error(payload.error ?? "Could not load webhook event history.");
      }
      setWebhookEvents(payload.events);
    } catch (error) {
      logClientRequestFailure("GET /api/admin/webhook-events", status, error);
      if (status === 401 || status === 403) setAccessToken(null);
    } finally {
      setLoadingWebhookEvents(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const client = createSupabaseBrowserClient();
      void client.auth
        .getSession()
        .then(({ data, error: sessionError }) => {
          if (!active) return;
          if (sessionError) {
            logClientRequestFailure("Supabase Auth getSession", null, sessionError);
          } else if (data.session?.access_token) {
            setAccessToken(data.session.access_token);
          }
          setInitializing(false);
        })
        .catch((sessionError: unknown) => {
          if (!active) return;
          logClientRequestFailure("Supabase Auth getSession", null, sessionError);
          setInitializing(false);
        });
    } catch (clientError) {
      window.setTimeout(() => {
        logClientRequestFailure("Initialize Supabase browser client", null, clientError);
        setInitializing(false);
      }, 0);
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const timer = window.setTimeout(() => void loadOrders(accessToken), 0);
    return () => window.clearTimeout(timer);
  }, [accessToken, loadOrders]);

  useEffect(() => {
    if (!accessToken || activeSection !== "webhooks") return;
    const timer = window.setTimeout(
      () => void loadWebhookEvents(accessToken),
      0
    );
    return () => window.clearTimeout(timer);
  }, [accessToken, activeSection, loadWebhookEvents]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const client = createSupabaseBrowserClient();
      const { data, error: signInError } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      if (!data.session?.access_token) {
        throw new Error("Đăng nhập không trả về phiên hợp lệ.");
      }
      setAccessToken(data.session.access_token);
      setPassword("");
    } catch (signInError) {
      logClientRequestFailure(
        "Supabase Auth signInWithPassword",
        typeof signInError === "object" &&
          signInError !== null &&
          "status" in signInError &&
          typeof signInError.status === "number"
          ? signInError.status
          : null,
        signInError
      );
    }
  }

  async function signOut() {
    try {
      const client = createSupabaseBrowserClient();
      const { error: signOutError } = await client.auth.signOut();
      if (signOutError) throw signOutError;
      setAccessToken(null);
      setOrders([]);
      setWebhookEvents([]);
      setActiveSection("orders");
    } catch (signOutError) {
      logClientRequestFailure("Supabase Auth signOut", null, signOutError);
    }
  }

  async function updateOrder(orderId: string, action: "confirm" | "cancel") {
    if (!accessToken) return;
    setWorkingOrder(orderId);
    let status: number | null = null;
    try {
      const response = await fetch("/api/admin/orders/action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, action }),
      });
      status = response.status;
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể cập nhật đơn hàng.");
      }
      await loadOrders(accessToken);
    } catch (actionError) {
      logClientRequestFailure("POST /api/admin/orders/action", status, actionError);
    } finally {
      setWorkingOrder(null);
    }
  }

  async function saveOrderDetails(
    order: AdminOrder,
    isPaid: boolean,
    adminNote: string
  ) {
    if (!accessToken) return;
    setWorkingOrder(order.id);
    let status: number | null = null;
    try {
      const response = await fetch("/api/admin/orders/action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          isPaid,
          adminNote,
        }),
      });
      status = response.status;
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể lưu thông tin đơn hàng.");
      }
      await loadOrders(accessToken);
    } catch (detailsError) {
      logClientRequestFailure("POST /api/admin/orders/action", status, detailsError);
    } finally {
      setWorkingOrder(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-neutral-900">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <div>
            <h1 className="text-xl font-extrabold text-[#0047AB]">Tony Food Admin</h1>
            <p className="mt-1 text-xs text-neutral-500">Quản lý cửa hàng</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-[#0047AB]">
              Xem cửa hàng
            </Link>
            {accessToken && (
              <button
                type="button"
                onClick={() => void signOut()}
                className="text-sm font-semibold text-neutral-600 hover:text-red-600"
              >
                Đăng xuất
              </button>
            )}
          </div>
        </header>

        {initializing ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
            Đang kiểm tra phiên quản trị...
          </p>
        ) : !accessToken ? (
          <section className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xs">
            <h2 className="text-lg font-bold">Đăng nhập quản trị</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Chỉ tài khoản được cấp quyền ADMIN mới truy cập được đơn hàng.
            </p>
            <form onSubmit={signIn} className="mt-5 space-y-4">
              <label className="block text-sm font-medium">
                Email
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#0047AB]"
                />
              </label>
              <label className="block text-sm font-medium">
                Mật khẩu
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#0047AB]"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-[#0047AB] px-5 py-3 text-sm font-bold text-white hover:bg-[#003987]"
              >
                Đăng nhập
              </button>
            </form>
          </section>
        ) : (
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
            <nav
              aria-label="Quản lý cửa hàng"
              className="flex gap-2 rounded-2xl border border-neutral-200 bg-white p-2 md:sticky md:top-6 md:flex-col md:self-start"
            >
              <button
                type="button"
                aria-current={activeSection === "products" ? "page" : undefined}
                onClick={() => setActiveSection("products")}
                className={`flex-1 rounded-xl px-4 py-3 text-left text-sm font-semibold md:flex-none ${
                  activeSection === "products"
                    ? "bg-[#0047AB] text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Sản phẩm
              </button>
              <button
                type="button"
                aria-current={activeSection === "orders" ? "page" : undefined}
                onClick={() => setActiveSection("orders")}
                className={`flex-1 rounded-xl px-4 py-3 text-left text-sm font-semibold md:flex-none ${
                  activeSection === "orders"
                    ? "bg-[#0047AB] text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Đơn hàng
              </button>
              <button
                type="button"
                aria-current={activeSection === "webhooks" ? "page" : undefined}
                onClick={() => setActiveSection("webhooks")}
                className={`flex-1 rounded-xl px-4 py-3 text-left text-sm font-semibold md:flex-none ${
                  activeSection === "webhooks"
                    ? "bg-[#0047AB] text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Webhook logs
              </button>
            </nav>

            <section className="min-w-0">
            {activeSection === "products" ? (
              <AdminCatalogPanel accessToken={accessToken} />
            ) : activeSection === "webhooks" ? (
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Lịch sử webhook</h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      Chỉ lưu loại sự kiện và mã bản ghi, không lưu payload có thông tin khách hàng.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={loadingWebhookEvents}
                    onClick={() => void loadWebhookEvents(accessToken)}
                    className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {loadingWebhookEvents ? "Đang tải..." : "Làm mới"}
                  </button>
                </div>
                {loadingWebhookEvents && webhookEvents.length === 0 ? (
                  <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
                    Đang tải lịch sử webhook...
                  </p>
                ) : webhookEvents.length === 0 ? (
                  <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
                    Chưa nhận webhook nào.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <div className="divide-y divide-neutral-100">
                      {webhookEvents.map((event) => (
                        <article
                          key={event.id}
                          className="grid gap-2 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {event.event_type} · {event.table_name}
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-neutral-500">
                              {event.row_id}
                            </p>
                          </div>
                          <time
                            dateTime={event.received_at}
                            className="text-xs text-neutral-500"
                          >
                            {formatDate(event.received_at)}
                          </time>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-neutral-500">
                  Hiển thị tối đa 100 sự kiện gần đây. Nhật ký cũ hơn 90 ngày được dọn dẹp.
                </p>
              </section>
            ) : (
              <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Đơn hàng gần đây</h2>
                <p className="mt-1 text-sm text-neutral-500">Theo dõi đơn và ghi nhận thanh toán.</p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => void loadOrders(accessToken)}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {loading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>
            {orders.length === 0 && !loading ? (
              <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
                Chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{order.order_number}</h3>
                        <p className="mt-1 text-xs text-neutral-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        {statusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <p className="font-semibold">{order.customer_name}</p>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="text-[#0047AB] hover:underline"
                        >
                          {order.customer_phone}
                        </a>
                        <p className="mt-1 text-neutral-600">{order.delivery_address}</p>
                        {order.note && (
                          <p className="mt-2 text-xs text-neutral-500">
                            Ghi chú giao hàng: {order.note}
                          </p>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3">
                            <span>
                              {item.product_name} ({item.product_unit}) × {item.quantity}
                            </span>
                            <span className="shrink-0 font-medium">
                              {formatPrice(item.total_price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
                      <p className="text-sm font-bold">
                        Tổng: {formatPrice(order.total)}
                      </p>
                      <label className="inline-flex items-center gap-2 text-sm font-semibold">
                        <input
                          type="checkbox"
                          checked={order.is_paid}
                          disabled={workingOrder === order.id}
                          onChange={(event) =>
                            void saveOrderDetails(
                              order,
                              event.target.checked,
                              adminNotes[order.id] ?? order.admin_note ?? ""
                            )
                          }
                          className="h-4 w-4 accent-[#0047AB]"
                        />
                        Đã thanh toán
                      </label>
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                      <label className="flex-1 text-sm font-medium">
                        Ghi chú nội bộ
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={adminNotes[order.id] ?? order.admin_note ?? ""}
                          onChange={(event) =>
                            setAdminNotes((current) => ({
                              ...current,
                              [order.id]: event.target.value,
                            }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#0047AB]"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={workingOrder === order.id}
                        onClick={() =>
                          void saveOrderDetails(
                            order,
                            order.is_paid,
                            adminNotes[order.id] ?? order.admin_note ?? ""
                          )
                        }
                        className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {workingOrder === order.id ? "Đang lưu..." : "Lưu ghi chú"}
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-100 pt-4">
                      {order.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={workingOrder === order.id}
                            onClick={() => void updateOrder(order.id, "cancel")}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            Hủy đơn
                          </button>
                          <button
                            type="button"
                            disabled={workingOrder === order.id}
                            onClick={() => void updateOrder(order.id, "confirm")}
                            className="rounded-full bg-[#0047AB] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {workingOrder === order.id ? "Đang xử lý..." : "Xác nhận và trừ kho"}
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
              </>
            )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
