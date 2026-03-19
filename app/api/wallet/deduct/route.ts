export async function POST(req: NextRequest) {

  const { userId, amount } = body;

  const { data: user } = await supabase
    .from("users")
    .select("wallet_balance, bank_name, account_number")
    .eq("auth_id", userId)
    .single();

  if (user.wallet_balance < amount) {
    return NextResponse.json({ error: "Insufficient funds" });
  }

  /*
  Call payout API
  */

  await supabase
    .from("users")
    .update({
      wallet_balance: user.wallet_balance - amount
    })
    .eq("auth_id", userId);

  return NextResponse.json({ success: true });
}