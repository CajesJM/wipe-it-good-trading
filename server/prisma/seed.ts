import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const products = [
  ["Generators", "Toyohoma TH12000DX Gasoline Generator", 4850000, 8, "/images/equipment-hero.png"],
  ["Generators", "3.5kW Silent Inverter Generator", 3290000, 12, "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=85"],
  ["Power Tools", "21V Brushless Cordless Drill Kit", 459000, 34, "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=85"],
  ["Power Tools", "900W Variable-Speed Angle Grinder", 289000, 27, "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=900&q=85"],
  ["Carwash Equipment", "2200W High-Pressure Washer Set", 789000, 19, "/images/equipment-hero.png"],
  ["Carwash Equipment", "30L Wet & Dry Industrial Vacuum", 649000, 16, "https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=900&q=85"],
  ["Hand Tools", "108-Piece Mechanic Socket Set", 379000, 42, "https://images.unsplash.com/photo-1533069027836-fa937181a8ce?auto=format&fit=crop&w=900&q=85"],
  ["Accessories", "Heavy-Duty Generator Cable Kit", 189000, 65, "https://images.unsplash.com/photo-1533069027836-fa937181a8ce?auto=format&fit=crop&w=900&q=85"],
] as const;

async function main() {
  for (const [categoryName, name, priceCentavos, stockOnHand, imageUrl] of products) {
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await prisma.category.upsert({ where: { slug }, create: { name: categoryName, slug }, update: {} });
    const productSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await prisma.product.upsert({ where: { slug: productSlug }, create: { categoryId: category.id, sku: `WIG-${productSlug.slice(0, 16).toUpperCase()}`, slug: productSlug, name, description: `Reliable ${name} for home, trade, and business use. Contact Wipe It Good Trading for product guidance and bulk pricing.`, priceCentavos, stockOnHand, status: "ACTIVE", featured: categoryName === "Generators" || categoryName === "Power Tools", images: { create: { url: imageUrl, altText: name } } }, update: { priceCentavos, stockOnHand, status: "ACTIVE" } });
  }
}

main().finally(() => prisma.$disconnect());
