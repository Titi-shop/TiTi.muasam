import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getUserFromBearer } from "@/lib/auth/getUserFromBearer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   GET /api/profile
========================= */
export async function GET() {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { rows } = await query(
      `
      SELECT *
      FROM user_profiles
      WHERE user_id = $1
      LIMIT 1
      `,
      [user.pi_uid]
    );

    const profile = rows[0] ?? null;

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err) {
    console.error("PROFILE GET ERROR:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

/* =========================
   POST /api/profile (UPSERT)
========================= */
export async function POST(req: Request) {
  const user = await getUserFromBearer();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const raw: unknown = await req.json().catch(() => null);
  if (typeof raw !== "object" || raw === null) {
    return NextResponse.json({ error: "INVALID_BODY" }, { status: 400 });
  }

  const body = raw as Record<string, unknown>;

  /* ========= NORMALIZE ========= */
  const full_name =
    typeof body.full_name === "string"
      ? body.full_name.trim().slice(0, 100)
      : null;

  const phone =
    typeof body.phone === "string"
      ? body.phone.trim().slice(0, 20)
      : null;

  const avatar_url =
    typeof body.avatar_url === "string"
      ? body.avatar_url
      : null;

  const bio =
    typeof body.bio === "string"
      ? body.bio.trim().slice(0, 500)
      : null;

  const country =
    typeof body.country === "string"
      ? body.country.trim().slice(0, 50)
      : null;

  const province =
    typeof body.province === "string"
      ? body.province.trim().slice(0, 100)
      : null;

  const district =
    typeof body.district === "string"
      ? body.district.trim().slice(0, 100)
      : null;

  const ward =
    typeof body.ward === "string"
      ? body.ward.trim().slice(0, 100)
      : null;

  const address_line =
    typeof body.address_line === "string"
      ? body.address_line.trim().slice(0, 255)
      : null;

  const postal_code =
    typeof body.postal_code === "string"
      ? body.postal_code.trim().slice(0, 20)
      : null;

  const shop_name =
    typeof body.shop_name === "string"
      ? body.shop_name.trim().slice(0, 150)
      : null;

  const shop_slug =
    typeof body.shop_slug === "string"
      ? body.shop_slug.trim().toLowerCase().slice(0, 150)
      : null;

  const shop_description =
    typeof body.shop_description === "string"
      ? body.shop_description.trim().slice(0, 1000)
      : null;

  const shop_banner =
    typeof body.shop_banner === "string"
      ? body.shop_banner
      : null;

  try {
    await query(
      `
      INSERT INTO user_profiles (
        user_id,
        full_name,
        phone,
        avatar_url,
        bio,
        country,
        province,
        district,
        ward,
        address_line,
        postal_code,
        shop_name,
        shop_slug,
        shop_description,
        shop_banner,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        NOW(),NOW()
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        country = EXCLUDED.country,
        province = EXCLUDED.province,
        district = EXCLUDED.district,
        ward = EXCLUDED.ward,
        address_line = EXCLUDED.address_line,
        postal_code = EXCLUDED.postal_code,
        shop_name = EXCLUDED.shop_name,
        shop_slug = EXCLUDED.shop_slug,
        shop_description = EXCLUDED.shop_description,
        shop_banner = EXCLUDED.shop_banner,
        updated_at = NOW()
      `,
      [
        user.pi_uid,
        full_name,
        phone,
        avatar_url,
        bio,
        country,
        province,
        district,
        ward,
        address_line,
        postal_code,
        shop_name,
        shop_slug,
        shop_description,
        shop_banner,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PROFILE SAVE ERROR:", err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
