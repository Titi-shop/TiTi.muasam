export async function GET() {
  const user = await getUserFromBearer();

  console.log("SELLER COUNT USER:", user);

  if (!user || user.role !== "seller") {
    console.log("UNAUTHORIZED SELLER COUNT");
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const stats = await getSellerOrdersCount(user.pi_uid);

  return NextResponse.json(stats);
}
