import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const categoryColors: Record<string, string> = {
  "Thịt bò & Heo": "#FEF2F2",
  "Xúc xích & Lạp xưởng": "#FEF3C7",
  "Phô mai & Bơ sữa": "#F3E8FF",
  "Viên thả lẩu": "#ECFDF5",
};

const categoryBadges: Record<string, string> = {
  "Ba Chỉ Bò Mỹ Cuộn": "Bán chạy nhất",
  "Ba Chỉ Heo Thái Cuộn": "Giá sỉ xưởng",
  "Lạp Xưởng Tươi Đài Loan (LC Foods)": "Hàng hot",
  "Phô Mai Lát Emborg Burger Slices": "Nhập khẩu",
  "Viên Thả Lẩu Trứng Cá (LC Foods)": "Món lẩu yêu thích",
};

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.rpc("api_public_catalog");
    if (error) {
      console.error("Supabase public catalog RPC failed.", error.message);
      return NextResponse.json(
        { error: "Không thể tải danh sách sản phẩm." },
        { status: 502 }
      );
    }

    const catalog = data as {
      categories: string[];
      products: {
        id: string;
        slug: string;
        name: string;
        subtitle: string;
        category: string;
        price: number;
        unit: string;
        stock: number;
        image: string;
        tags: string[];
      }[];
    } | null;

    return NextResponse.json({
      categories: catalog?.categories ?? [],
      products: (catalog?.products ?? []).map((product) => {
        const category = product.category ?? "Khác";
        const price = Number(product.price);
        const productTags = product.tags ?? [];
        return {
          ...product,
          price,
          priceFormatted: new Intl.NumberFormat("vi-VN").format(price) + "₫",
          bgColor: categoryColors[category] ?? "#F3F4F6",
          badge: productTags[0] ?? categoryBadges[product.name],
        };
      }),
    });
  } catch (error) {
    console.error(
      "Product API configuration or query failed.",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json(
      { error: "Danh mục sản phẩm hiện không khả dụng." },
      { status: 503 }
    );
  }
}
