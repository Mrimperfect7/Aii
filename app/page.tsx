import { TryOnButton } from "@/components/tryon/TryOnButton";
import { TryOnProduct } from "@/lib/tryon/types";

// Stand-in for what a real product page would already have on hand.
const sampleProduct: TryOnProduct = {
  id: "demo-ring-001",
  name: "Aurora Solitaire Ring",
  category: "ring",
  imageUrl: "/demo/sample-ring.jpg",
  variantId: "gold",
  variantLabel: "18K Gold Plated / Size 7",
  metalColor: "gold",
  price: 2499,
  currency: "₹",
  productUrl: "/products/aurora-solitaire-ring",
};

export default function DemoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[#A9A29A]">AI Try-On module demo</p>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sampleProduct.imageUrl}
        alt={sampleProduct.name}
        className="h-56 w-56 rounded-2xl object-cover"
      />

      <div>
        <h1 className="text-xl font-medium">{sampleProduct.name}</h1>
        <p className="mt-1 text-sm text-[#A9A29A]">{sampleProduct.variantLabel}</p>
        <p className="mt-2 text-lg text-[#C6A664]">
          {sampleProduct.currency}
          {sampleProduct.price}
        </p>
      </div>

      <TryOnButton product={sampleProduct} />

      <p className="mt-8 max-w-sm text-xs text-[#6E6862]">
        Running against the mock provider by default — the result screen shows your own uploaded
        photo (or the placeholder character) unchanged, since no real try-on API is wired up.
        Swap in a real TRYON_PROVIDER when you're ready to see actual jewelry placement.
      </p>
    </main>
  );
}
