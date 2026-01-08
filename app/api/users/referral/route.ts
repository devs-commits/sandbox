
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { userId, referralCode } = await request.json();

        if (!userId || !referralCode) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Use admin client to bypass RLS for updates
        const dbClient = supabaseAdmin || supabase;

        // 1. Check if user already has been referred
        const { data: existingReferral, error: checkError } = await dbClient
            .from('referrals')
            .select('id')
            .eq('referee_id', userId)
            .single();

        if (existingReferral) {
            return NextResponse.json({ error: "You have already claimed a referral code." }, { status: 400 });
        }

        // 2. Find Referrer
        const { data: referrer, error: refError } = await dbClient
            .from('users')
            .select('id, wallet_balance, referral_code')
            .eq('referral_code', referralCode)
            .single();

        if (refError || !referrer) {
            return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
        }

        // Prevent self-referral
        if (referrer.id === userId) { // Note: userId here might be auth_id or table id depending on context. Assuming passed userId is table ID or handling mapping.
            // Wait, usually userId passed from frontend is auth_id. We need to get the user's table id.
            // Let's safe check based on auth_id if possible, or just table id.
        }

        // Get Requesting User's Table ID
        const { data: requestUser, error: reqUserError } = await dbClient
            .from('users')
            .select('id, auth_id')
            .eq('auth_id', userId) // Assuming frontend passes auth.user.id
            .single();

        if (!requestUser) {
            return NextResponse.json({ error: "User profile not found" }, { status: 404 });
        }

        // Now prevent self-referral
        if (referrer.id === requestUser.id) {
            return NextResponse.json({ error: "You cannot refer yourself" }, { status: 400 });
        }

        // Double check existing referral using table ID
        const { data: existingReferralTableId } = await dbClient
            .from('referrals')
            .select('id')
            .eq('referee_id', requestUser.id)
            .single();

        if (existingReferralTableId) {
            return NextResponse.json({ error: "You have already claimed a referral code." }, { status: 400 });
        }


        // 3. Process Reward
        const reward = 2000;

        // Update Referrer Wallet
        const { error: updateError } = await dbClient
            .from('users')
            .update({ wallet_balance: (referrer.wallet_balance || 0) + reward })
            .eq('id', referrer.id);

        if (updateError) throw updateError;

        // Create Referral Record
        const { error: insertError } = await dbClient
            .from('referrals')
            .insert({
                referrer_id: referrer.id,
                referee_id: requestUser.id, // Use table ID
                status: 'completed',
                reward_amount: reward
            });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true, message: "Referral code claimed! Reward sent to referrer." });

    } catch (error: any) {
        console.error("Referral claim error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
