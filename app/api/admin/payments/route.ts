import { NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseClientFromRequest } from '@/lib/supabase';

export async function GET(request: Request) {
  // 1. 🔒 SECURITY CHECKPOINT: VERIFY THE USER IS AN ADMIN
  try {
    const supabaseServer = createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (adminError || adminUser?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
  } catch (error) {
    console.error("Auth verification failed:", error);
    return NextResponse.json({ success: false, error: "Authentication error" }, { status: 500 });
  }

  // 2. PARSE QUERY PARAMS
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") || "1";
  const perPage = searchParams.get("perPage") || "100"; // Bumped to 100 to scan a wider range
  const status = searchParams.get("status") || "all";

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET) {
    return NextResponse.json(
      { error: "PAYSTACK_SECRET_KEY missing" },
      { status: 500 }
    );
  }

  try {
    let url = `https://api.paystack.co/transaction?page=${page}&perPage=${perPage}`;
    if (status !== "all") {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // 🔥 Real-time fetch. No more 30s delays on the admin dashboard.
    });

    if (!response.ok) throw new Error(`Paystack error: ${response.statusText}`);

    const paystackData = await response.json();

    // 3. 🔥 FILTER: Kobo Range captures both flat rates & gateway charge variants safely
    const platformTransactions = paystackData.data.filter((tx: any) => {
      const amt = Number(tx.amount); // amount is in Kobo
      const isMonthly = amt >= 1480000 && amt <= 1560000; // ~14.8k to 15.6k NGN
      const isQuarterly = amt >= 4000000 && amt <= 4250000; // ~40k to 42.5k NGN
      return isMonthly || isQuarterly;
    });

    const transactions = platformTransactions.map((tx: any) => {
      const history = tx.log?.history || [];
      const lastAction = history.length > 0 ? history[history.length - 1] : null;

      return {
        id: tx.id,
        reference: tx.reference,
        amount: tx.amount / 100, // Convert back to standard NGN for the frontend
        currency: tx.currency,
        status: tx.status,
        channel: tx.channel || "Unknown",
        createdAt: tx.created_at,
        paidAt: tx.paid_at,
        gatewayResponse: tx.gateway_response,
        customer: {
          email: tx.customer?.email,
          customerCode: tx.customer?.customer_code,
        },
        plan: tx.plan_object && Object.keys(tx.plan_object).length > 0
          ? {
              name: tx.plan_object.name,
              interval: tx.plan_object.interval,
            }
          : null,
        insights: {
          ip: tx.ip_address || 'N/A',
          timeSpentInSeconds: tx.log?.time_spent || 0,
          isMobile: tx.log?.mobile ?? false,
          errorCount: tx.log?.errors || 0,
          lastActionMessage: lastAction?.message || "No checkout action logged",
          fullHistory: history,
        },
      };
    });

    return NextResponse.json({
      success: true,
      meta: {
        ...paystackData.meta,
        filteredTotal: transactions.length 
      },
      data: transactions,
    });
  } catch (error: any) {
    console.error("Payments API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}