import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SignupData {
  email: string;
  fullName: string;
  phone?: string;
  role: "student" | "recruiter";
  country?: string;
  track?: string;
  experienceLevel?: string;
  subscriptionPlan?: string;
}

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const data = (await req.json()) as SignupData;

    if (!data.email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const mlApiKey = Deno.env.get("MAILERLITE_API_KEY");
    // Existing signup group remains the free-trial destination.
    const freeTrialGroupId = Deno.env.get("MAILERLITE_SIGNUP_GROUP_ID");
    const paidGroupId = Deno.env.get("MAILERLITE_PAID_GROUP_ID");

    if (!mlApiKey || !freeTrialGroupId) {
      console.error("MailerLite configuration missing");
      return new Response(
        JSON.stringify({ error: "MailerLite configuration missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedPlan = (data.subscriptionPlan || "monthly")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const isFreeTrial = normalizedPlan.startsWith("trial") || ["freetrial", "free-trial", "free_trial"].includes(normalizedPlan);
    const groupId = isFreeTrial ? freeTrialGroupId : paidGroupId;

    if (!groupId) {
      console.error("MailerLite paid group configuration missing");
      return new Response(JSON.stringify({ error: "MailerLite configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add to MailerLite
    const mlResponse = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mlApiKey}`,
        },
        body: JSON.stringify({
          email: data.email,
          fields: {
            name: data.fullName,
            phone: data.phone || "",
            role: data.role,
            country: data.country || "",
            track: data.track || "",
            experience_level: data.experienceLevel || "",
            subscription_plan: normalizedPlan,
          },
          groups: [groupId],
          status: "active",
        }),
      }
    );

    if (!mlResponse.ok) {
      console.error("MailerLite subscriber sync failed:", mlResponse.status);
      // Don't fail signup if MailerLite fails - log and continue
      return new Response(
        JSON.stringify({
          success: false,
          warning: "Failed to add to MailerLite",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
