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
    const [
      { data: products, error: productsError },
      { data: categories, error: categoriesError },
    ] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id,name,slug,short_description,base_price,unit,stock,featured,category_id"
        )
        .eq("status", "ACTIVE")
        .order("name"),
      supabase.from("categories").select("id,name"),
    ]);

    if (productsError || categoriesError) {
      console.error("Supabase catalog query failed.", {
        productsError: productsError?.message,
        categoriesError: categoriesError?.message,
      });
      return NextResponse.json(
        { error: "Không thể tải danh sách sản phẩm." },
        { status: 502 }
      );
    }

    const productIds = (products ?? []).map((product) => product.id);
    const [
      { data: images, error: imagesError },
      { data: productTags, error: productTagsError },
      { data: tags, error: tagsError },
    ] =
      productIds.length > 0
        ? await Promise.all([
            supabase
              .from("product_images")
              .select("product_id,url,is_primary")
              .in("product_id", productIds),
            supabase
              .from("product_tags")
              .select("product_id,tag_id")
              .in("product_id", productIds),
            supabase.from("tags").select("id,name"),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
            await supabase.from("tags").select("id,name"),
          ];

    if (imagesError || productTagsError || tagsError) {
      console.error("Supabase product relations query failed.", {
        imagesError: imagesError?.message,
        productTagsError: productTagsError?.message,
        tagsError: tagsError?.message,
      });
      return NextResponse.json(
        { error: "Không thể tải hình ảnh hoặc nhãn sản phẩm." },
        { status: 502 }
      );
    }

    const categoryNames = new Map(
      (categories ?? []).map((category) => [category.id, category.name])
    );
    const tagNames = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));
    const imageByProduct = new Map<string, string>();
    const tagsByProduct = new Map<string, string[]>();
    for (const image of [...(images ?? [])].sort(
      (left, right) => Number(right.is_primary) - Number(left.is_primary)
    )) {
      if (!imageByProduct.has(image.product_id)) {
        imageByProduct.set(image.product_id, image.url);
      }
    }
    for (const relation of productTags ?? []) {
      const tagName = tagNames.get(relation.tag_id);
      if (!tagName) continue;
      const productTagList = tagsByProduct.get(relation.product_id) ?? [];
      productTagList.push(tagName);
      tagsByProduct.set(relation.product_id, productTagList);
    }

    return NextResponse.json({
      categories: (categories ?? []).map((category) => category.name),
      products: (products ?? []).map((product) => {
        const category = categoryNames.get(product.category_id) ?? "Khác";
        const price = Number(product.base_price);
        const productTagsForCard = tagsByProduct.get(product.id) ?? [];
        return {
          id: product.slug,
          slug: product.slug,
          name: product.name,
          subtitle: product.short_description ?? "",
          category,
          price,
          priceFormatted: new Intl.NumberFormat("vi-VN").format(price) + "₫",
          unit: product.unit,
          stock: product.stock,
          image: imageByProduct.get(product.id) ?? "/images/logo.png",
          bgColor: categoryColors[category] ?? "#F3F4F6",
          tags: productTagsForCard,
          badge: productTagsForCard[0] ?? categoryBadges[product.name],
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
