import { NextRequest, NextResponse } from "next/server";
import { getCharactersForCategory } from "@/lib/tryon/characters";
import { JewelryCategory } from "@/lib/tryon/types";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") as JewelryCategory | null;
  if (!category) {
    return NextResponse.json({ message: "Missing category" }, { status: 400 });
  }

  const characters = getCharactersForCategory(category).map((c) => ({
    id: c.id,
    label: c.label,
    thumbnailUrl: c.thumbnailUrl,
    gender: c.gender,
  }));

  return NextResponse.json({ characters });
}
