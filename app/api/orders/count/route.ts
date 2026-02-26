export async function GET() {
  const user = await getUserFromBearer();

  console.log("USER:", user);

  if (!user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const counts = await getOrdersCountByBuyer(user.pi_uid);

  console.log("COUNTS:", counts);

  return NextResponse.json(counts);
}
