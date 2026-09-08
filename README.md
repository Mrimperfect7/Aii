# AI Jewelry Try-On — standalone module

A drop-in AI Try-On feature for a jewelry product page: an **AI Try On** button
opens a fullscreen modal where the customer tries the currently-viewed
product on either a curated AI character or their own uploaded photo.

Built against the stack you're using for SHYN.ISH (Next.js App Router,
TypeScript, React, Tailwind). Not wired into your actual codebase — drop
these folders into your project and follow the integration steps below.

## What's here

```
lib/tryon/
  types.ts              shared types + the TryOnProvider interface
  provider.ts            provider factory, reads env vars, caches the instance
  providers/
    perfectcorp.ts        Perfect Corp jewelry try-on implementation (see note below)
    mock.ts                returns the input photo unchanged — for local dev, no API key needed
  categoryConfig.ts       per-category placement rules (earrings, necklace, ring, bracelet, ...)
  characters.ts           static AI character roster (swap placeholder assets for real ones)
  imagePreprocess.ts      upload validation, resize, format normalization
  storageAdapter.ts       STUB — wire to your actual object storage/CDN
  rateLimit.ts            in-memory rate limit + duplicate-request dedupe

app/api/tryon/
  generate/route.ts       POST — runs a try-on, character or self-photo
  characters/route.ts     GET  — character roster filtered by jewelry category

components/tryon/
  TryOnButton.tsx          the button; lazy-loads everything else
  TryOnModal.tsx            fullscreen modal + screen router
  ModeSelect.tsx, CharacterSelectScreen.tsx, SelfImageScreen.tsx, ResultScreen.tsx

hooks/useTryOn.ts          client state machine (idle → generating → result/error)
analytics/tryOnEvents.ts   typed event dispatch — wire to your existing GA4/Pixel calls
```

## Integration steps

1. **Copy the folders** into your Next.js app (adjust the `@/` import alias
   in `tsconfig.json` if you use a different one).
2. **Install the one new dependency**: `npm install sharp` (used for
   server-side image validation/resize in `imagePreprocess.ts`).
3. **Wire `storageAdapter.ts`** to whatever you already use for product
   image storage/CDN — this is the only file that's a stub on purpose,
   since it depends entirely on your infra. Uploaded selfies and generated
   results should expire automatically (the file sets a 1-hour TTL by
   default); use your store's native expiry (S3 lifecycle rule, R2 expiring
   object, signed URL with a short TTL) rather than a manual cleanup job.
4. **Drop `<TryOnButton product={...} />`** into your product page, next to
   the product options. Build the `product` object from data you already
   have on that page — id, name, category, current variant's image URL,
   metal color, price. No manual entry, and it automatically reflects
   whichever variant (gold/silver/rose gold, size) is currently selected,
   since you pass that in fresh on every render.
5. **Replace the placeholder character assets** in `characters.ts` and
   `public/tryon-characters/` — generate each base photo once with any
   general-purpose image model (fidelity constraints only apply to the
   jewelry itself), review for quality and the diversity the spec calls
   for, upload to your CDN, register in the roster. This is a one-time
   content task, not something that runs per request.
6. **Choose your provider.** `TRYON_PROVIDER=mock` works immediately with
   zero setup so you can build and demo the full flow. For production, see
   below.

## Recommended provider: Perfect Corp's jewelry Try-On API

Rather than a general image-generation model, I'd point `TRYON_PROVIDER` at
a **jewelry-specific** try-on API — jewelry fidelity is explicitly the top
priority in the spec, and a purpose-built jewelry API is designed to overlay
a *given* product image rather than reinterpret it, which is a better fit
than asking a general model to "draw a similar necklace." **Perfect Corp**
publishes category-specific endpoints (necklace, earring, ring, bracelet)
built exactly for this: send your product image + a wearer photo, get back
a composited result, REST + Bearer auth. `providers/perfectcorp.ts`
implements against that documented pattern.

**Before going live**, confirm the exact endpoint paths, field names, and
response shape against Perfect Corp's current API reference and your
account's onboarding docs — the file is a solid working starting point, not
a verified 1:1 spec, since I can't see your account's actual API contract
from here. Reasonable alternatives if Perfect Corp isn't the right fit on
pricing or terms: Camweara (jewelry + eyewear, Shopify-friendly) or
SellerPic (broader accessory catalog including jewelry/watches/bags,
Shopify app + free tier for testing).

`providers/mock.ts` shows the shape a second implementation should take —
copying that file and swapping the body for a real fetch call is the whole
job of adding a new vendor.

## Privacy

- Uploaded selfies and generated results are treated as ephemeral by
  default — `buildEphemeralStorageKey()` sets a 1-hour TTL; wire your
  storage adapter to actually enforce it.
- Character base photos are static pre-generated assets, not built from any
  customer's photo.
- `analytics/tryOnEvents.ts` only ever sends product/category/mode/outcome
  data — never image bytes or raw error text.
- Say this plainly in the UI near the upload step if your legal/brand team
  wants a longer privacy note than the one-line captureHint already shown.

## Known gaps to close before shipping

- `storageAdapter.putEphemeralObject` currently throws — it's a stub.
- The character roster ships with placeholder image paths under
  `public/tryon-characters/` — replace with real assets.
- No automated tests included; the module is structured (provider
  interface, category config, pure preprocessing functions) to be easy to
  unit test once it's in your repo.
- `add_to_cart_after_tryon` in `ResultScreen.tsx` fires the analytics event
  and closes the modal but delegates the actual cart mutation to your
  existing add-to-cart flow — hook up the commented-out dispatch line (or
  call your cart hook/action directly) to your store implementation.
