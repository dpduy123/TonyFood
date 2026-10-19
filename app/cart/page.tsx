"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useCart } from "../components/cart-provider";
import type { CatalogProduct } from "../data/snacks";
import { loadCatalog } from "../data/catalog-client";
import { logClientRequestFailure } from "@/lib/client-request-log";

interface CreatedOrder {
  orderNumber: string;
  status: string;
  total: number;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "₫";
}

export default function CartPage() {
  const { items, storageError, setQuantity, removeItem, clearCart } = useCart();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const catalog = await loadCatalog();
        if (active) setProducts(catalog.products);
      } catch (error) {
        if (active) {
          logClientRequestFailure("GET /api/products", null, error);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải sản phẩm trong giỏ."
          );
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    }
    void loadProducts();
    return () => {
      active = false;
    };
  }, []);

  const productBySlug = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products]
  );
  const cartProducts = items.map((line) => ({
    ...line,
    product: productBySlug.get(line.slug),
  }));
  const subtotal = cartProducts.reduce(
    (sum, line) => sum + (line.product?.price ?? 0) * line.quantity,
    0
  );
  const hasUnavailableItems = cartProducts.some(
    (line) => !line.product || line.product.stock < line.quantity
  );

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    const requestBody = {
      customerName: formData.get("customerName"),
      customerPhone: formData.get("customerPhone"),
      deliveryAddress: formData.get("deliveryAddress"),
      note: formData.get("note"),
      items: items.map(({ slug, quantity }) => ({ slug, quantity })),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const payload = (await response.json()) as {
        order?: CreatedOrder;
        error?: string;
      };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error ?? "Không thể tạo đơn hàng.");
      }
      setCreatedOrder(payload.order);
      clearCart();
      setCheckoutOpen(false);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Không thể tạo đơn hàng."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-neutral-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <Link href="/" className="text-sm font-bold text-[#0047AB]">
            ← Tiếp tục mua sắm
          </Link>
          <h1 className="text-lg font-extrabold">Giỏ hàng</h1>
        </header>

        {storageError && (
          <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            {storageError}
          </p>
        )}
        {submitError && !checkoutOpen && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </p>
        )}
        {createdOrder ? (
          <section className="rounded-3xl border border-green-200 bg-white p-8 text-center shadow-xs">
            <p className="text-4xl" aria-hidden="true">✓</p>
            <h2 className="mt-3 text-xl font-bold text-neutral-900">
              Đặt hàng thành công
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Mã đơn hàng:{" "}
              <strong className="text-neutral-900">{createdOrder.orderNumber}</strong>
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Trạng thái: Chờ cửa hàng xác nhận
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0047AB]">
              Tổng tạm tính: {formatPrice(Number(createdOrder.total))}
            </p>
            <p className="mt-4 text-xs text-neutral-500">
              Tony Food sẽ liên hệ bạn qua số điện thoại đã cung cấp.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-[#0047AB] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Tiếp tục mua sắm
            </Link>
          </section>
        ) : loadingProducts ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
            Đang tải giỏ hàng...
          </p>
        ) : loadError ? (
          <p role="alert" className="rounded-2xl bg-white p-8 text-center text-sm text-red-700">
            {loadError}
          </p>
        ) : items.length === 0 ? (
          <section className="rounded-3xl border border-neutral-200 bg-white p-10 text-center shadow-xs">
            <p className="text-4xl" aria-hidden="true">🛒</p>
            <h2 className="mt-3 text-lg font-bold">Giỏ hàng đang trống</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Chọn sản phẩm bạn muốn mua để bắt đầu đặt hàng.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-full bg-[#0047AB] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Xem sản phẩm
            </Link>
          </section>
        ) : (
          <div className="space-y-4">
            <section className="space-y-3">
              {cartProducts.map(({ slug, quantity, product }) => (
                <article
                  key={slug}
                  className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs"
                >
                  <div className="relative h-20 w-20 shrink-0 rounded-xl bg-neutral-50">
                    {product && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold">{product?.name ?? "Sản phẩm không còn bán"}</h2>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {product ? `/ ${product.unit}` : "Vui lòng xóa sản phẩm khỏi giỏ"}
                    </p>
                    {product && (
                      <p className="mt-1 text-sm font-bold text-red-600">
                        {formatPrice(product.price)}
                      </p>
                    )}
                    {product && product.stock < quantity && (
                      <p role="alert" className="mt-1 text-xs text-red-700">
                        Tồn kho hiện còn {product.stock}; hãy giảm số lượng.
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`Giảm số lượng ${product?.name ?? slug}`}
                          onClick={() => setQuantity(slug, quantity - 1)}
                          disabled={quantity <= 1}
                          className="h-8 w-8 rounded-full border border-neutral-200 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Tăng số lượng ${product?.name ?? slug}`}
                          onClick={() => setQuantity(slug, quantity + 1)}
                          disabled={!product || quantity >= Math.min(product.stock, 99)}
                          className="h-8 w-8 rounded-full border border-neutral-200 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(slug)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Tạm tính</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                Phí giao hàng sẽ được cửa hàng xác nhận sau.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setCheckoutOpen(true);
                }}
                disabled={hasUnavailableItems || items.length === 0}
                className="mt-5 w-full rounded-full bg-[#0047AB] px-5 py-3 text-sm font-bold text-white hover:bg-[#003987] disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                Tiến hành thanh toán
              </button>
            </section>
          </div>
        )}
      </div>

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setCheckoutOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 id="checkout-title" className="text-xl font-bold">
                  Thông tin giao hàng
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Đơn hàng sẽ ở trạng thái chờ cửa hàng xác nhận.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                disabled={submitting}
                aria-label="Đóng biểu mẫu"
                className="text-2xl leading-none text-neutral-500 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitOrder} className="space-y-4">
              <label className="block text-sm font-medium">
                Họ và tên
                <input
                  name="customerName"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#0047AB]"
                />
              </label>
              <label className="block text-sm font-medium">
                Số điện thoại
                <input
                  name="customerPhone"
                  required
                  minLength={8}
                  maxLength={30}
                  autoComplete="tel"
                  inputMode="tel"
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#0047AB]"
                />
              </label>
              <label className="block text-sm font-medium">
                Địa chỉ giao hàng
                <textarea
                  name="deliveryAddress"
                  required
                  minLength={5}
                  maxLength={500}
                  autoComplete="street-address"
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#0047AB]"
                />
              </label>
              <label className="block text-sm font-medium">
                Ghi chú giao hàng <span className="font-normal text-neutral-500">(không bắt buộc)</span>
                <textarea
                  name="note"
                  maxLength={1000}
                  rows={2}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3 py-2.5 outline-none focus:border-[#0047AB]"
                />
              </label>
              {submitError && (
                <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  {submitError}
                </p>
              )}
              <div className="flex items-center justify-between border-t border-neutral-200 pt-4 text-sm">
                <span>Tạm tính</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <button
                type="submit"
                disabled={submitting || hasUnavailableItems}
                className="w-full rounded-full bg-[#0047AB] px-5 py-3 text-sm font-bold text-white hover:bg-[#003987] disabled:cursor-wait disabled:bg-neutral-300"
              >
                {submitting ? "Đang gửi đơn..." : "Gửi đơn hàng"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
