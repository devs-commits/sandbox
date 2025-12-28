import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createSupabaseClientWithToken } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    let supabase = supabaseAdmin;

    if (!supabase) {
        // Fallback: Try to use the authenticated user's token
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (token) {
            supabase = createSupabaseClientWithToken(token);
        }
    }

    if (!supabase) {
      console.error("Supabase client could not be initialized. Missing Service Role Key and no User Token provided.");
      return NextResponse.json({ error: 'Configuration Error: Database access not available.' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7days';
    
    const days = timeRange === '30days' ? 30 : timeRange === '90days' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateIso = startDate.toISOString();

    // 1. Fetch Transactions (Revenue & Unlocks)
    const { data: transactions, error: txError } = await supabase
      .from('recruiter_transactions')
      .select('amount, created_at, type')
      .gte('created_at', startDateIso)
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    // Calculate Totals
    const creditTx = transactions?.filter(tx => tx.type === 'credit') || [];
    const debitTx = transactions?.filter(tx => tx.type === 'debit') || [];

    const totalRevenue = creditTx.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const totalUnlockFees = debitTx.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    // 2. Fetch New Interns
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('created_at, full_name')
      .eq('role', 'student')
      .gte('created_at', startDateIso)
      .order('created_at', { ascending: false });

    if (userError) throw userError;

    const newInterns = users?.length || 0;

    // 3. Calculate Churn (Inactive Recruiters)
    // Definition: % of Total Recruiters who have NO transactions in the selected period.
    const { count: totalRecruiters, error: countError } = await supabase
        .from('recruiters')
        .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;

    // Get unique recruiter IDs from transactions in the period
    const activeRecruiterIds = new Set(transactions?.map(tx => tx.recruiter_id || 'unknown')); // Assuming transactions have recruiter_id
    // Note: If transactions don't have recruiter_id directly (might be joined), we need to check schema.
    // Based on previous file reads, 'recruiter_transactions' has 'recruiter_id'.
    
    const activeCount = activeRecruiterIds.size;
    const totalRecruitersCount = totalRecruiters || 1; // Avoid division by zero
    
    // Churn Rate = (Inactive / Total) * 100
    const inactiveCount = Math.max(0, totalRecruitersCount - activeCount);
    const churnRate = ((inactiveCount / totalRecruitersCount) * 100).toFixed(1) + '%';


    // 4. Prepare Chart Data
    const getChartData = (dataItems: any[], valueKey?: string) => {
        const chartData = new Array(days).fill(0);
        const today = new Date();
        
        dataItems.forEach(item => {
            const itemDate = new Date(item.created_at);
            const diffTime = Math.abs(today.getTime() - itemDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // diffDays = 1 means within last 24 hours (Today/Yesterday depending on time)
            // We want to map this to the array indices.
            // Index 0 = Oldest day
            // Index days-1 = Newest day (Today)
            
            if (diffDays <= days && diffDays > 0) {
                const val = valueKey ? (Number(item[valueKey]) || 0) : 1;
                chartData[days - diffDays] += val;
            } else if (diffDays === 0) {
                 // Should be rare but handle it as today
                 const val = valueKey ? (Number(item[valueKey]) || 0) : 1;
                 chartData[days - 1] += val;
            }
        });

        // Downsample if needed
        if (days > 14) {
            const chunkSize = Math.ceil(days / 14);
            const downsampled = [];
            for (let i = 0; i < chartData.length; i += chunkSize) {
                const chunk = chartData.slice(i, i + chunkSize);
                downsampled.push(chunk.reduce((a, b) => a + b, 0));
            }
            return downsampled;
        }
        return chartData;
    };

    const revenueChartData = getChartData(creditTx, 'amount');
    const unlocksChartData = getChartData(debitTx, 'amount');
    const internsChartData = getChartData(users || []);

    // 4. Recent Activity
    const recentTx = transactions?.slice(0, 3).map(tx => ({
        type: 'transaction',
        user: 'Recruiter', 
        action: `processed transaction of ₦${tx.amount}`,
        time: new Date(tx.created_at).toLocaleTimeString(),
        timestamp: new Date(tx.created_at).getTime()
    })) || [];

    const recentUsers = users?.slice(0, 3).map(u => ({
        type: 'signup',
        user: u.full_name || 'New User',
        action: 'joined the platform',
        time: new Date(u.created_at).toLocaleTimeString(),
        timestamp: new Date(u.created_at).getTime()
    })) || [];

    const activityItems = [...recentTx, ...recentUsers]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    return NextResponse.json({
        totalRevenue,
        newInterns,
        unlockFees: totalUnlockFees,
        churnRate,
        revenueChartData,
        internsChartData,
        unlocksChartData,
        activityItems
    });

  } catch (error: any) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
