import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase env variables",
        },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${url}/rest/v1/users?select=id&limit=1`,
      {
        headers: {
          apikey: key,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Supabase request failed (${res.status})`,
        },
        { status: 500 }
      );
    }

    const data: unknown = await res.json();

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
