"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [workingOrder, setWorkingOrder] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
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
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Không thể tải đơn hàng."
      );
      if (loadError instanceof Error && loadError.message.includes("quyền truy cập")) {
        setAccessToken(null);
      }
    } finally {
      setLoading(false);
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
            setError("Không thể kiểm tra phiên đăng nhập.");
          } else if (data.session?.access_token) {
            setAccessToken(data.session.access_token);
          }
          setInitializing(false);
        })
        .catch((sessionError: unknown) => {
          if (!active) return;
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Không thể kiểm tra phiên đăng nhập."
          );
          setInitializing(false);
        });
    } catch (clientError) {
      window.setTimeout(() => {
        setError(
          clientError instanceof Error
            ? clientError.message
            : "Cấu hình Supabase chưa đầy đủ."
        );
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

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Không thể đăng nhập."
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
      setError(null);
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Không thể đăng xuất."
      );
    }
  }

  async function updateOrder(orderId: string, action: "confirm" | "cancel") {
    if (!accessToken) return;
    setWorkingOrder(orderId);
    setError(null);
    try {
      const response = await fetch("/api/admin/orders/action", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, action }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể cập nhật đơn hàng.");
      }
      await loadOrders(accessToken);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Không thể cập nhật đơn hàng."
      );
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
    setError(null);
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
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Không thể lưu thông tin đơn hàng.");
      }
      await loadOrders(accessToken);
    } catch (detailsError) {
      setError(
        detailsError instanceof Error
          ? detailsError.message
          : "Không thể lưu thông tin đơn hàng."
      );
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
            <p className="mt-1 text-xs text-neutral-500">Quản lý đơn hàng</p>
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

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

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
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Đơn hàng gần đây</h2>
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
          </section>
        )}
      </div>
    </main>
  );
}
