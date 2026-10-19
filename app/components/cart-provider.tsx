"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const CART_STORAGE_KEY = "tonyfood-cart-v1";
const MAX_QUANTITY = 99;

export interface CartLine {
  slug: string;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  storageError: string | null;
  addItem: (slug: string, stock: number) => boolean;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(value: unknown): value is CartLine {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.slug === "string" &&
    /^[a-z0-9-]{1,100}$/.test(line.slug) &&
    Number.isInteger(line.quantity) &&
    Number(line.quantity) >= 1 &&
    Number(line.quantity) <= MAX_QUANTITY
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const itemsRef = useRef<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.every(isCartLine)) {
            itemsRef.current = parsed;
            setItems(parsed);
          } else {
            localStorage.removeItem(CART_STORAGE_KEY);
            setStorageError("Giỏ hàng cũ không hợp lệ và đã được làm mới.");
          }
        }
      } catch (error) {
        console.error("Unable to restore the saved cart.", error);
        setStorageError("Không thể đọc giỏ hàng đã lưu trên thiết bị.");
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Unable to save the cart to browser storage.", error);
      queueMicrotask(() =>
        setStorageError("Không thể lưu giỏ hàng trên thiết bị này.")
      );
    }
  }, [hydrated, items]);

  const updateItems = useCallback(
    (update: (current: CartLine[]) => CartLine[]) => {
      const next = update(itemsRef.current);
      itemsRef.current = next;
      setItems(next);
      return next;
    },
    []
  );

  const addItem = useCallback((slug: string, stock: number) => {
    let added = false;
    updateItems((current) => {
      const existing = current.find((line) => line.slug === slug);
      const nextQuantity = (existing?.quantity ?? 0) + 1;
      if (stock < nextQuantity || nextQuantity > MAX_QUANTITY) return current;
      added = true;
      if (!existing) return [...current, { slug, quantity: 1 }];
      return current.map((line) =>
        line.slug === slug ? { ...line, quantity: nextQuantity } : line
      );
    });
    return added;
  }, [updateItems]);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    if (quantity < 1) return;
    updateItems((current) =>
      current.map((line) =>
        line.slug === slug
          ? { ...line, quantity: Math.min(Math.floor(quantity), MAX_QUANTITY) }
          : line
      )
    );
  }, [updateItems]);

  const removeItem = useCallback((slug: string) => {
    updateItems((current) => current.filter((line) => line.slug !== slug));
  }, [updateItems]);

  const clearCart = useCallback(
    () => updateItems(() => []),
    [updateItems]
  );

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      storageError,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
    }),
    [items, storageError, addItem, setQuantity, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider.");
  return value;
}
